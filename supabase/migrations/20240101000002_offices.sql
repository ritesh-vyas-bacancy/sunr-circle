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
