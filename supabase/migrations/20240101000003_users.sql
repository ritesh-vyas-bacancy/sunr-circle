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
