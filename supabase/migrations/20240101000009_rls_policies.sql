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
