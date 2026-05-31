-- ============================================================
-- SEED: dev_seed.sql
-- Development seed data for SUNR Circle.
-- Run against a local Supabase instance or dev project ONLY.
--
-- IMPORTANT: The users INSERT below uses placeholder UUIDs.
-- In development, first create auth.users entries via the
-- Supabase Auth Admin API (or Supabase Dashboard), then
-- update the UUID values in the INSERT below to match.
--
-- Supabase CLI (local): supabase db reset --local
-- Supabase CLI (remote): run this file via SQL Editor
-- ============================================================

-- ============================================================
-- Organization: SUNR Circle
-- ============================================================
INSERT INTO organizations (id, name, short_name, code, primary_color, secondary_color, support_email, support_phone)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Saurashtra / Narmada Vidyut Vitaran Company Ltd.',
  'SUNR Circle',
  'SUNR',
  '#1a3d7c',
  '#f0f4ff',
  'support@sunrcircle.in',
  '1800-XXX-XXXX'
);

-- ============================================================
-- Offices: 1 Circle -> 2 Divisions -> 4 Sub Divisions
-- ============================================================

-- Circle
INSERT INTO offices (id, organization_id, parent_id, office_type, name, code)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'circle',
  'SUNR Circle Office',
  '01'
);

-- Divisions
INSERT INTO offices (id, organization_id, parent_id, office_type, name, code) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'division', 'Division North', '0101'),
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   'division', 'Division South', '0102');

-- Sub Divisions
INSERT INTO offices (id, organization_id, parent_id, office_type, name, code) VALUES
  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'sub_division', 'Sub Division North A', '010101'),
  ('b0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'sub_division', 'Sub Division North B', '010102'),
  ('b0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'sub_division', 'Sub Division South A', '010201'),
  ('b0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'sub_division', 'Sub Division South B', '010202');

-- ============================================================
-- Users
-- NOTE: Replace the UUIDs (c0000000-...) below with actual
-- auth.users UUIDs after creating users via:
--   Supabase Dashboard > Authentication > Add User
-- OR via the Admin API:
--   POST /auth/v1/admin/users with { email, password, email_confirm: true }
-- ============================================================
INSERT INTO users (id, organization_id, sub_division_id, role, full_name, employee_id, mobile_number) VALUES
  -- back_office — no sub_division
  ('c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   NULL,
   'back_office',
   'Admin User',
   'EMP001',
   '9900000001'),
  -- top_management — no sub_division
  ('c0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   NULL,
   'top_management',
   'Manager User',
   'EMP002',
   '9900000002'),
  -- call_centre — Sub Division North A
  ('c0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'call_centre',
   'CC Agent Ramesh',
   'EMP003',
   '9900000003'),
  -- line_man — Sub Division North A
  ('c0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'line_man',
   'Line Man Suresh',
   'EMP004',
   '9900000004'),
  -- call_centre — Sub Division South A
  ('c0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'call_centre',
   'CC Agent Priya',
   'EMP005',
   '9900000005'),
  -- line_man — Sub Division South A
  ('c0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'line_man',
   'Line Man Dinesh',
   'EMP006',
   '9900000006');

-- ============================================================
-- System Settings
-- ============================================================
INSERT INTO system_settings (organization_id, key, value, description) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'sla_hours_threshold',
   '24',
   'Hours before a complaint is flagged as SLA breached'),
  ('a0000000-0000-0000-0000-000000000001',
   'default_locale',
   'en',
   'Default app locale: en or gu'),
  (NULL,
   'system_version',
   '1.0.0',
   'System version for compatibility checks');

-- ============================================================
-- Sample Complaints (Sub Division North A)
-- Requires valid created_by UUIDs from public.users.
-- Replace with actual UUIDs if auth.users are remapped.
-- ============================================================
INSERT INTO complaints (
  organization_id,
  sub_division_id,
  raw_complaint_number,
  consumer_name,
  consumer_mobile,
  nature_of_complaint,
  complaint_remarks,
  status,
  created_by
) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'FC12345',
   'Ramesh Patel',
   '9876543210',
   'No Power Supply',
   'Power outage since morning at Sector 4',
   'open',
   'c0000000-0000-0000-0000-000000000003'),

  ('a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'FC12346',
   'Sunita Shah',
   '9876543211',
   'Street Light Not Working',
   'Street light on main road off since 3 days',
   'assigned',
   'c0000000-0000-0000-0000-000000000003'),

  ('a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'FC12347',
   'Haresh Modi',
   '9876543212',
   'Meter Burnt',
   'Electricity meter shows burning smell',
   'in_progress',
   'c0000000-0000-0000-0000-000000000003'),

  ('a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'FC12348',
   'Kiran Desai',
   '9876543213',
   'Bill Dispute',
   'Consumer claims wrong reading for July',
   'closed',
   'c0000000-0000-0000-0000-000000000003');

-- Update the assigned and in_progress complaints to reflect timestamps
UPDATE complaints SET
  assigned_to     = 'c0000000-0000-0000-0000-000000000004',
  assigned_at     = now() - INTERVAL '2 hours'
WHERE raw_complaint_number = 'FC12346'
  AND organization_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE complaints SET
  assigned_to     = 'c0000000-0000-0000-0000-000000000004',
  assigned_at     = now() - INTERVAL '5 hours',
  in_progress_at  = now() - INTERVAL '3 hours',
  attend_remarks  = 'Reached site, inspecting meter'
WHERE raw_complaint_number = 'FC12347'
  AND organization_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE complaints SET
  assigned_to     = 'c0000000-0000-0000-0000-000000000004',
  assigned_at     = now() - INTERVAL '26 hours',
  in_progress_at  = now() - INTERVAL '25 hours',
  closed_at       = now() - INTERVAL '24 hours',
  attend_remarks  = 'Bill corrected after meter re-read. Consumer satisfied.'
WHERE raw_complaint_number = 'FC12348'
  AND organization_id = 'a0000000-0000-0000-0000-000000000001';
