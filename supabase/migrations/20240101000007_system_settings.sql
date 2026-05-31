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
