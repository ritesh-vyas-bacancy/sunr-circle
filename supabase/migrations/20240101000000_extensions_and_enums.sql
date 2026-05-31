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
