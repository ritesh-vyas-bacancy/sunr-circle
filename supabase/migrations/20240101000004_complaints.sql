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
-- subqueries — they are limited to immutable expressions using
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

-- ── Trigger: set_complaint_number ────────────────────────────────────────────
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
