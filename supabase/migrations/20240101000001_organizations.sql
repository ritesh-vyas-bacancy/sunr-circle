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
