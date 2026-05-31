-- ============================================================
-- RLS Policy Verification Tests
-- Run in Supabase SQL Editor to verify policies are correct.
-- These are SELECT-only verification queries — they cannot
-- modify data. All should return expected row counts.
-- ============================================================

-- 1. Verify RLS is enabled on all 7 tables
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'organizations','offices','users','complaints',
    'complaint_logs','notification_logs','system_settings'
  )
ORDER BY tablename;
-- Expected: all 7 rows with rls_enabled = true

-- 2. Count all RLS policies
SELECT
  tablename,
  COUNT(*) AS policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Expected: 18+ policies across the 7 tables

-- 3. Verify helper functions exist
SELECT
  proname AS function_name,
  prosecdef AS security_definer
FROM pg_proc
WHERE proname IN (
  'get_current_user_role',
  'get_current_user_subdivision',
  'get_current_user_organization',
  'set_complaint_number',
  'protect_complaint_number',
  'log_complaint_status_change',
  'set_updated_at'
)
ORDER BY proname;
-- Expected: 7 rows, all helper functions present

-- 4. Verify audit triggers exist
SELECT
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- Expected: triggers on complaints, organizations, offices, users, system_settings

-- 5. Verify indexes exist on complaint search columns
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename = 'complaints'
  AND schemaname = 'public'
ORDER BY indexname;
-- Expected: GIN trigram indexes on consumer_name, consumer_mobile, raw_complaint_number

-- 6. Verify organization seed data
SELECT id, name, code, is_active FROM organizations;
-- Expected: 1 row — SUNR Circle

-- 7. Verify office hierarchy seed data
SELECT office_type, COUNT(*) as count FROM offices GROUP BY office_type ORDER BY office_type;
-- Expected: circle=1, division=2, sub_division=4

-- 8. Verify complaint number trigger works (requires a test complaint)
-- INSERT INTO complaints (...) — do NOT run in production; use dev environment
-- After inserting, verify: SELECT complaint_number FROM complaints WHERE id = '...';
-- Expected: 'SUNR-XXXXXX-FC12345' format
