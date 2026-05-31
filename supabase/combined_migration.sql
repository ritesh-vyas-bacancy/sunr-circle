-- ============================================================
-- SUNR Circle — Combined Migration Script
-- Paste this ENTIRE script into Supabase SQL Editor and click RUN
-- URL: https://supabase.com/dashboard/project/oaftuyikaxgzlyyzgenk/editor
-- ============================================================


-- ============================================================
-- FILE: 20240101000000_extensions_and_enums.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000000_extensions_and_enums
-- Extensions and shared ENUM types used across all tables.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enums
CREATE TYPE user_role AS ENUM (
  'back_office',
  'call_centre',
  'line_man',
  'top_management'
);

CREATE TYPE office_type AS ENUM (
  'circle',
  'division',
  'sub_division'
);

CREATE TYPE complaint_status AS ENUM (
  'open',
  'assigned',
  'in_progress',
  'closed',
  'rejected'
);

CREATE TYPE notification_channel AS ENUM (
  'sms',
  'whatsapp',
  'email',
  'push'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'skipped'
);

-- ============================================================
-- Reusable updated_at trigger function
-- Applied via BEFORE UPDATE trigger on all mutable tables.
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- FILE: 20240101000001_organizations.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000001_organizations
-- Top-level organization record. Supports multi-tenancy.
-- SUNR Circle is seeded as the first (and currently only) org.
-- ============================================================

CREATE TABLE organizations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  short_name        TEXT        NOT NULL,
  code              TEXT        NOT NULL UNIQUE,          -- e.g. 'SUNR'; used in complaint_number
  logo_url          TEXT,
  primary_color     TEXT        NOT NULL DEFAULT '#1a3d7c',
  secondary_color   TEXT        NOT NULL DEFAULT '#f0f4ff',
  support_email     TEXT,
  support_phone     TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organizations_code_format CHECK (code ~ '^[A-Z0-9]{2,10}$')
);

COMMENT ON TABLE  organizations                IS 'Root tenant entity. Each electricity circle/utility is one organization.';
COMMENT ON COLUMN organizations.code           IS 'Short uppercase alphanumeric identifier used as prefix in complaint numbers. Example: SUNR';
COMMENT ON COLUMN organizations.primary_color  IS 'Hex color for the admin panel and mobile app branding.';

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FILE: 20240101000002_offices.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000002_offices
-- Self-referential hierarchy: circle -> division -> sub_division.
-- All three levels are stored in one table with office_type ENUM
-- and a nullable parent_id FK.
-- A CHECK constraint enforces the hierarchy invariant.
-- ============================================================

CREATE TABLE offices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  parent_id       UUID        REFERENCES offices(id) ON DELETE RESTRICT,
  office_type     office_type NOT NULL,
  name            TEXT        NOT NULL,
  code            TEXT        NOT NULL,          -- e.g. '01', '0102', '010101' (app-padded)
  address         TEXT,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  CONSTRAINT offices_hierarchy_check CHECK (
    (office_type = 'circle'       AND parent_id IS NULL) OR
    (office_type = 'division'     AND parent_id IS NOT NULL) OR
    (office_type = 'sub_division' AND parent_id IS NOT NULL)
  )
);

COMMENT ON TABLE  offices              IS 'Unified office hierarchy table: circle, division, sub_division.';
COMMENT ON COLUMN offices.code        IS 'Numeric code used in complaint number composition. Must be unique within the organization.';
COMMENT ON COLUMN offices.parent_id   IS 'NULL for circle; division points to circle; sub_division points to division.';
COMMENT ON COLUMN offices.office_type IS 'Enum discriminator enforcing the 3-level hierarchy via CHECK constraint.';

CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FILE: 20240101000003_users.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000003_users
-- Application user profiles linked 1:1 to auth.users.
-- Roles: back_office, call_centre, line_man, top_management.
-- call_centre and line_man must have sub_division_id set.
-- back_office and top_management operate at the org level (NULL sub_division_id).
-- ============================================================

CREATE TABLE users (
  id                UUID      PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   UUID      NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sub_division_id   UUID      REFERENCES offices(id) ON DELETE RESTRICT,  -- NULL for back_office, top_management
  role              user_role NOT NULL,
  full_name         TEXT      NOT NULL,
  employee_id       TEXT,
  mobile_number     TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, employee_id),
  CONSTRAINT users_subdivision_required CHECK (
    -- Field staff must be assigned to a sub-division
    (role IN ('call_centre', 'line_man') AND sub_division_id IS NOT NULL)
    OR
    -- Management roles operate at the organization level
    (role IN ('back_office', 'top_management'))
  )
);

COMMENT ON TABLE  users                   IS 'Application user profiles. Each row links to an auth.users row via the shared UUID primary key.';
COMMENT ON COLUMN users.sub_division_id   IS 'Mandatory for call_centre and line_man; NULL for back_office and top_management.';
COMMENT ON COLUMN users.employee_id       IS 'Internal HR employee ID. Unique within an organization. May be NULL for initial data migration.';
COMMENT ON COLUMN users.last_login_at     IS 'Updated by application on successful authentication; not managed by trigger.';

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FILE: 20240101000004_complaints.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000004_complaints
-- Core complaint entity.
--
-- complaint_number is populated by a BEFORE INSERT trigger
-- (set_complaint_number) that looks up org.code and office.code
-- and stores: org_code || '-' || subdivision_code || '-' || raw_complaint_number
-- Example: SUNR-010101-FC12345
--
-- NOTE: PostgreSQL GENERATED ALWAYS AS columns cannot contain
-- subqueries â€” they are limited to immutable expressions using
-- only the row's own columns. A BEFORE INSERT trigger is the
-- correct pattern for cross-table computed columns.
--
-- Workflow: open -> assigned -> in_progress -> closed (or rejected).
-- Closed and rejected are terminal states (enforced by RLS).
-- ============================================================

CREATE TABLE complaints (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID             NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sub_division_id       UUID             NOT NULL REFERENCES offices(id) ON DELETE RESTRICT,
  raw_complaint_number  TEXT             NOT NULL,   -- User-entered, e.g. 'FC12345'
  complaint_number      TEXT,                        -- Set by trigger: 'SUNR-010101-FC12345'
  consumer_name         TEXT             NOT NULL,
  consumer_mobile       TEXT             NOT NULL,
  nature_of_complaint   TEXT             NOT NULL,
  complaint_remarks     TEXT,
  status                complaint_status NOT NULL DEFAULT 'open',
  created_by            UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to           UUID             REFERENCES users(id) ON DELETE SET NULL,
  attend_remarks        TEXT,
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT now(),
  assigned_at           TIMESTAMPTZ,
  in_progress_at        TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sub_division_id, raw_complaint_number),
  CONSTRAINT complaints_consumer_mobile_format CHECK (
    consumer_mobile ~ '^[6-9][0-9]{9}$'   -- Indian mobile: starts 6-9, 10 digits total
  )
);

COMMENT ON TABLE  complaints                      IS 'Core complaint entity. One row per consumer complaint. Terminal states: closed, rejected.';
COMMENT ON COLUMN complaints.raw_complaint_number IS 'User-supplied complaint reference. Unique within org+subdivision. Example: FC12345.';
COMMENT ON COLUMN complaints.complaint_number     IS 'Trigger-computed display label: org_code-subdivision_code-raw. Example: SUNR-010101-FC12345. Immutable after insert.';
COMMENT ON COLUMN complaints.assigned_at          IS 'Set by application when status transitions to assigned.';
COMMENT ON COLUMN complaints.in_progress_at       IS 'Set by application when status transitions to in_progress.';
COMMENT ON COLUMN complaints.closed_at            IS 'Set by application when status transitions to closed or rejected.';
COMMENT ON COLUMN complaints.attend_remarks       IS 'Field staff remarks recorded during in_progress or closing.';

-- â”€â”€ Trigger: set_complaint_number â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Runs BEFORE INSERT, assembles complaint_number from org + subdivision codes.
-- Also validates that raw_complaint_number is non-empty after trimming.
CREATE OR REPLACE FUNCTION set_complaint_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_code       TEXT;
  v_subdiv_code    TEXT;
BEGIN
  -- Trim the raw number
  NEW.raw_complaint_number := TRIM(NEW.raw_complaint_number);

  IF NEW.raw_complaint_number = '' THEN
    RAISE EXCEPTION 'raw_complaint_number cannot be empty';
  END IF;

  -- Look up org code
  SELECT code INTO v_org_code
    FROM organizations
   WHERE id = NEW.organization_id;

  IF v_org_code IS NULL THEN
    RAISE EXCEPTION 'Organization % not found', NEW.organization_id;
  END IF;

  -- Look up subdivision code
  SELECT code INTO v_subdiv_code
    FROM offices
   WHERE id = NEW.sub_division_id;

  IF v_subdiv_code IS NULL THEN
    RAISE EXCEPTION 'Sub Division % not found', NEW.sub_division_id;
  END IF;

  -- Assemble the display-friendly complaint number
  NEW.complaint_number := v_org_code || '-' || v_subdiv_code || '-' || NEW.raw_complaint_number;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_complaint_number
  BEFORE INSERT ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_complaint_number();

-- Prevent complaint_number being overwritten after insert
CREATE OR REPLACE FUNCTION protect_complaint_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.complaint_number IS DISTINCT FROM OLD.complaint_number THEN
    RAISE EXCEPTION 'complaint_number is immutable after creation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_complaint_number
  BEFORE UPDATE OF complaint_number ON complaints
  FOR EACH ROW EXECUTE FUNCTION protect_complaint_number();

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FILE: 20240101000005_complaint_logs.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000005_complaint_logs
-- Immutable append-only audit trail for complaint status changes.
--
-- Populated exclusively by the log_complaint_status_change() trigger.
-- RULE statements prevent any UPDATE or DELETE on this table,
-- even by service-role direct SQL.
--
-- The trigger fires AFTER UPDATE OF status ON complaints,
-- captures OLD.status, NEW.status, auth.uid(), and a JSONB
-- snapshot of assigned_to and attend_remarks.
-- ============================================================

CREATE TABLE complaint_logs (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID             NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  old_status    complaint_status,               -- NULL on the first transition (open -> assigned)
  new_status    complaint_status NOT NULL,
  remarks       TEXT,
  changed_by    UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  metadata      JSONB,                          -- snapshot: assigned_to, attend_remarks
  logged_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
  -- No updated_at: append-only table
);

COMMENT ON TABLE  complaint_logs             IS 'Immutable audit trail. Populated only by trigger. UPDATE and DELETE are blocked by RULE.';
COMMENT ON COLUMN complaint_logs.old_status  IS 'Previous status. NULL when complaint is first created (no prior state).';
COMMENT ON COLUMN complaint_logs.metadata    IS 'JSONB snapshot of assigned_to and attend_remarks at time of transition.';

-- Block mutations: these rules silently swallow any UPDATE or DELETE attempt
CREATE RULE complaint_logs_no_update AS ON UPDATE TO complaint_logs DO INSTEAD NOTHING;
CREATE RULE complaint_logs_no_delete AS ON DELETE TO complaint_logs DO INSTEAD NOTHING;

-- ============================================================
-- TRIGGER FUNCTION: log_complaint_status_change
-- Fires AFTER UPDATE OF status ON complaints.
-- Uses SECURITY DEFINER to insert into complaint_logs as a
-- trusted system actor, bypassing RLS on complaint_logs.
-- auth.uid() is still captured at the moment of the triggering
-- user's transaction.
-- ============================================================
CREATE OR REPLACE FUNCTION log_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO complaint_logs (
      complaint_id,
      old_status,
      new_status,
      changed_by,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'assigned_to',    NEW.assigned_to,
        'attend_remarks', NEW.attend_remarks
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION log_complaint_status_change() IS
  'Trigger function. Inserts one row into complaint_logs for every status change on complaints. '
  'SECURITY DEFINER ensures the insert succeeds regardless of the calling user''s RLS context.';

CREATE TRIGGER trg_complaint_audit
  AFTER UPDATE OF status ON complaints
  FOR EACH ROW EXECUTE FUNCTION log_complaint_status_change();


-- ============================================================
-- FILE: 20240101000006_notification_logs.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000006_notification_logs
-- Records every notification dispatch attempt.
-- In Phase 1 all rows are status='skipped' (providers stubbed).
-- In Phase 2, real provider integrations update status to
-- 'sent' or 'failed' and populate provider_message_id.
-- ============================================================

CREATE TABLE notification_logs (
  id                  UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id        UUID                 REFERENCES complaints(id) ON DELETE SET NULL,
  channel             notification_channel NOT NULL,
  recipient           TEXT                 NOT NULL,   -- Phone number or email address
  message_body        TEXT,
  status              notification_status  NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,                            -- External provider reference ID (Phase 2)
  error_message       TEXT,
  triggered_by        UUID                 REFERENCES users(id) ON DELETE SET NULL,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ          NOT NULL DEFAULT now()
  -- No updated_at: once sent or failed the record is not modified
);

COMMENT ON TABLE  notification_logs                  IS 'Notification dispatch log. Phase 1: all entries are skipped. Phase 2: real provider results.';
COMMENT ON COLUMN notification_logs.channel          IS 'Delivery channel: sms, whatsapp, email, push.';
COMMENT ON COLUMN notification_logs.provider_message_id IS 'External provider reference, e.g. MSG91 message ID. Null in Phase 1.';
COMMENT ON COLUMN notification_logs.recipient        IS 'E.164 phone number or RFC 5321 email address of the notification recipient.';


-- ============================================================
-- FILE: 20240101000007_system_settings.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000007_system_settings
-- Key-value configuration store.
-- organization_id = NULL means the setting is global (applies
-- to all organizations and system-wide tooling).
-- organization_id = <uuid> scopes the setting to that org.
-- UNIQUE (organization_id, key) uses NULL-distinct semantics:
-- PostgreSQL treats NULL != NULL in unique constraints, so a
-- global key (org=NULL) and an org-scoped key with the same
-- name coexist without conflict.
-- ============================================================

CREATE TABLE system_settings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = global
  key             TEXT        NOT NULL,
  value           TEXT        NOT NULL,
  description     TEXT,
  is_sensitive    BOOLEAN     NOT NULL DEFAULT FALSE,   -- TRUE = mask value in Studio UI
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

COMMENT ON TABLE  system_settings                IS 'Key-value configuration. NULL organization_id = global setting.';
COMMENT ON COLUMN system_settings.is_sensitive   IS 'When TRUE, the value should be masked in admin UI and logs.';
COMMENT ON COLUMN system_settings.key            IS 'Dot-notation keys recommended, e.g. sla_hours_threshold.';

CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- FILE: 20240101000008_indexes.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000008_indexes
-- Performance indexes. Applied after all tables exist.
--
-- Strategy:
--   FK indexes     â€” cover all foreign-key columns not already
--                    covered by a PRIMARY KEY or UNIQUE constraint.
--   Composite      â€” match the dominant query patterns identified
--                    in the Phase 1 architecture document.
--   GIN trigram    â€” enable sub-100ms ILIKE '%term%' on consumer
--                    name, mobile, and raw_complaint_number.
-- ============================================================

-- ============================================================
-- offices
-- ============================================================
CREATE INDEX idx_offices_organization_id ON offices (organization_id);
CREATE INDEX idx_offices_parent_id       ON offices (parent_id);         -- hierarchy traversal
CREATE INDEX idx_offices_type            ON offices (office_type);        -- filter by level

-- ============================================================
-- users
-- ============================================================
CREATE INDEX idx_users_organization_id   ON users (organization_id);
CREATE INDEX idx_users_sub_division_id   ON users (sub_division_id);     -- subdivision staff lookup
CREATE INDEX idx_users_role              ON users (role);                 -- list by role
CREATE INDEX idx_users_is_active         ON users (is_active);           -- active users filter

-- ============================================================
-- complaints
-- ============================================================
CREATE INDEX idx_complaints_organization_id  ON complaints (organization_id);
CREATE INDEX idx_complaints_sub_division_id  ON complaints (sub_division_id);
CREATE INDEX idx_complaints_status           ON complaints (status);          -- open/assigned queue
CREATE INDEX idx_complaints_created_by       ON complaints (created_by);
CREATE INDEX idx_complaints_assigned_to      ON complaints (assigned_to);     -- line man's queue
CREATE INDEX idx_complaints_created_at       ON complaints (created_at DESC); -- date range reporting
CREATE INDEX idx_complaints_closed_at        ON complaints (closed_at DESC);  -- SLA reporting
CREATE INDEX idx_complaints_number           ON complaints (complaint_number); -- exact label lookup

-- Composite: primary dashboard query (sub-division + status + date DESC)
CREATE INDEX idx_complaints_subdivision_status_date
  ON complaints (sub_division_id, status, created_at DESC);

-- GIN trigram indexes for ILIKE consumer search (pg_trgm required)
CREATE INDEX idx_complaints_consumer_name_trgm
  ON complaints USING GIN (consumer_name gin_trgm_ops);
CREATE INDEX idx_complaints_consumer_mobile_trgm
  ON complaints USING GIN (consumer_mobile gin_trgm_ops);
CREATE INDEX idx_complaints_raw_number_trgm
  ON complaints USING GIN (raw_complaint_number gin_trgm_ops);

-- ============================================================
-- complaint_logs
-- ============================================================
-- Covers the most common query: load timeline for one complaint
CREATE INDEX idx_complaint_logs_complaint_id
  ON complaint_logs (complaint_id, logged_at DESC);

-- ============================================================
-- notification_logs
-- ============================================================
CREATE INDEX idx_notification_logs_complaint_id ON notification_logs (complaint_id);
CREATE INDEX idx_notification_logs_status        ON notification_logs (status);    -- retry queue


-- ============================================================
-- FILE: 20240101000009_rls_policies.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000009_rls_policies
-- Row Level Security policies for all application tables.
--
-- Architecture:
--   1. RLS is ENABLED on every table.
--   2. Three SECURITY DEFINER helper functions resolve the
--      calling user's role, sub_division_id, and organization_id
--      from auth.uid() once per statement (plan-cache friendly).
--   3. Policies reference these helpers; they do NOT query
--      public.users directly, avoiding per-row sub-selects.
--
-- Role Policy Matrix (from Phase 1 design):
--   organizations  : back_office=SELECT+UPDATE, top_management=SELECT
--   offices        : back_office=ALL, others=SELECT (own org)
--   users          : back_office=ALL, top_management=SELECT(all),
--                    call_centre/line_man=SELECT(own row only)
--   complaints     : back_office=ALL, top_management=SELECT(all),
--                    call_centre=SELECT+INSERT(own subdivision),
--                    line_man=SELECT+UPDATE(own subdivision, assigned only)
--   complaint_logs : back_office+top_management=SELECT,
--                    call_centre+line_man=SELECT(own subdivision complaints),
--                    all authenticated=INSERT (changed_by=auth.uid())
--   notification_logs: back_office+top_management=SELECT, INSERT=own
--   system_settings: back_office=ALL, others=SELECT
-- ============================================================

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- These run as the function owner (postgres/service role),
-- avoiding RLS recursion and per-row overhead.
-- ============================================================

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_current_user_subdivision()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT sub_division_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_current_user_organization()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION get_current_user_role()         IS 'Returns the role of the currently authenticated user. SECURITY DEFINER to avoid RLS recursion on public.users.';
COMMENT ON FUNCTION get_current_user_subdivision()  IS 'Returns sub_division_id for the current user. NULL for back_office and top_management.';
COMMENT ON FUNCTION get_current_user_organization() IS 'Returns organization_id for the current user.';

-- ============================================================
-- RLS: organizations
-- back_office can SELECT and UPDATE their org.
-- top_management can SELECT.
-- call_centre and line_man have no direct org access.
-- ============================================================
CREATE POLICY "org_select_management" ON organizations
  FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('back_office', 'top_management'));

CREATE POLICY "org_update_back_office" ON organizations
  FOR UPDATE TO authenticated
  USING  (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');

-- ============================================================
-- RLS: offices
-- All authenticated users can SELECT offices in their org.
-- Only back_office can INSERT / UPDATE / DELETE.
-- ============================================================
CREATE POLICY "offices_select_all" ON offices
  FOR SELECT TO authenticated
  USING (organization_id = get_current_user_organization());

CREATE POLICY "offices_insert_back_office" ON offices
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() = 'back_office'
    AND organization_id = get_current_user_organization()
  );

CREATE POLICY "offices_update_back_office" ON offices
  FOR UPDATE TO authenticated
  USING  (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');

CREATE POLICY "offices_delete_back_office" ON offices
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'back_office');

-- ============================================================
-- RLS: users
-- back_office: full CRUD.
-- top_management: SELECT all in own org.
-- call_centre / line_man: SELECT + UPDATE their own row only.
-- Multiple SELECT policies on the same table are OR-combined.
-- ============================================================
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_select_management" ON users
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() IN ('back_office', 'top_management')
    AND organization_id = get_current_user_organization()
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_back_office" ON users
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() = 'back_office');

CREATE POLICY "users_update_back_office" ON users
  FOR UPDATE TO authenticated
  USING  (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');

CREATE POLICY "users_delete_back_office" ON users
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'back_office');

-- ============================================================
-- RLS: complaints
-- back_office: ALL within own org.
-- top_management: SELECT all within own org.
-- call_centre: SELECT + INSERT in own sub_division.
--   - INSERT enforces created_by = auth.uid() and status = 'open'.
-- line_man: SELECT in own sub_division; UPDATE only assigned rows
--   and only when status is not already terminal.
-- ============================================================
CREATE POLICY "complaints_all_back_office" ON complaints
  FOR ALL TO authenticated
  USING (
    get_current_user_role() = 'back_office'
    AND organization_id = get_current_user_organization()
  )
  WITH CHECK (
    get_current_user_role() = 'back_office'
    AND organization_id = get_current_user_organization()
  );

CREATE POLICY "complaints_select_top_management" ON complaints
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() = 'top_management'
    AND organization_id = get_current_user_organization()
  );

CREATE POLICY "complaints_select_call_centre" ON complaints
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() = 'call_centre'
    AND sub_division_id = get_current_user_subdivision()
  );

CREATE POLICY "complaints_insert_call_centre" ON complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    get_current_user_role() = 'call_centre'
    AND sub_division_id = get_current_user_subdivision()
    AND created_by = auth.uid()
    AND status = 'open'
  );

CREATE POLICY "complaints_select_line_man" ON complaints
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() = 'line_man'
    AND sub_division_id = get_current_user_subdivision()
  );

-- Line man may update only their assigned complaints;
-- status must not already be terminal (closed / rejected).
-- The WITH CHECK prevents reverting to 'open'.
CREATE POLICY "complaints_update_line_man" ON complaints
  FOR UPDATE TO authenticated
  USING (
    get_current_user_role() = 'line_man'
    AND assigned_to = auth.uid()
    AND status NOT IN ('closed', 'rejected')
  )
  WITH CHECK (
    get_current_user_role() = 'line_man'
    AND assigned_to = auth.uid()
    AND status NOT IN ('open')    -- line man cannot revert a complaint back to open
  );

-- ============================================================
-- RLS: complaint_logs
-- Insert: any authenticated user may insert a log row for
--   themselves (changed_by = auth.uid()). In practice this is
--   only called by the trigger (SECURITY DEFINER), but the
--   policy must allow it.
-- Select: management sees all; field staff see only logs for
--   complaints in their own sub_division.
-- ============================================================
CREATE POLICY "complaint_logs_insert" ON complaint_logs
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

CREATE POLICY "complaint_logs_select_management" ON complaint_logs
  FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('back_office', 'top_management'));

CREATE POLICY "complaint_logs_select_field" ON complaint_logs
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() IN ('call_centre', 'line_man')
    AND EXISTS (
      SELECT 1
      FROM complaints c
      WHERE c.id = complaint_logs.complaint_id
        AND c.sub_division_id = get_current_user_subdivision()
    )
  );

-- ============================================================
-- RLS: notification_logs
-- back_office and top_management: SELECT all.
-- Any authenticated user: INSERT (triggered_by = auth.uid()).
-- ============================================================
CREATE POLICY "notification_logs_select_management" ON notification_logs
  FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('back_office', 'top_management'));

CREATE POLICY "notification_logs_insert" ON notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (triggered_by = auth.uid());

-- ============================================================
-- RLS: system_settings
-- SELECT: any authenticated user may read global settings and
--   settings scoped to their organization.
-- ALL mutations: back_office only.
-- ============================================================
CREATE POLICY "system_settings_select_all" ON system_settings
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id = get_current_user_organization()
  );

CREATE POLICY "system_settings_all_back_office" ON system_settings
  FOR ALL TO authenticated
  USING  (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');


-- ============================================================
-- FILE: 20240101000010_storage_policies.sql
-- ============================================================
-- ============================================================
-- MIGRATION: 20240101000010_storage_policies
-- Storage bucket access policies.
--
-- PREREQUISITE: Create the following buckets in the Supabase
-- Dashboard (Storage > New Bucket) BEFORE running this migration:
--
--   1. org-assets
--      Private: true
--      File size limit: 5 MB
--      Allowed MIME types: image/png, image/jpeg, image/svg+xml
--
--   2. complaint-attachments
--      Private: true
--      File size limit: 20 MB
--      Allowed MIME types: image/*, application/pdf
--
-- Alternatively, create via Supabase CLI:
--   supabase storage create org-assets --public=false
--   supabase storage create complaint-attachments --public=false
-- ============================================================

-- ============================================================
-- BUCKET: org-assets
-- Stores organization logos and theme images.
-- Only back_office may upload or update.
-- All authenticated users may view (needed to display logos in UI).
-- ============================================================

CREATE POLICY "org_assets_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND get_current_user_role() = 'back_office'
  );

CREATE POLICY "org_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND get_current_user_role() = 'back_office'
  );

CREATE POLICY "org_assets_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'org-assets');

-- ============================================================
-- BUCKET: complaint-attachments
-- Reserved for Phase 2 (photo evidence, PDF attachments).
-- call_centre and line_man may upload.
-- All authenticated users may view.
-- Only back_office may delete.
-- ============================================================

CREATE POLICY "complaint_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() IN ('call_centre', 'line_man')
  );

CREATE POLICY "complaint_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'complaint-attachments');

CREATE POLICY "complaint_attachments_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() = 'back_office'
  );


