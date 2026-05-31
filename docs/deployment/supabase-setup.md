# Supabase Setup Guide

Complete step-by-step guide to set up the SUNR Circle Supabase backend.

---

## Prerequisites

- Supabase account at [supabase.com](https://supabase.com)
- Supabase CLI: `npm install -g supabase`
- `psql` client (for running seed scripts)

---

## Step 1 — Create Supabase Projects

Create three separate Supabase projects — one per environment:

| Environment | Project Name | Region |
|---|---|---|
| Development | `sunr-circle-dev` | `ap-south-1` (Mumbai) |
| Staging | `sunr-circle-staging` | `ap-south-1` |
| Production | `sunr-circle-prod` | `ap-south-1` |

For each project:
1. Go to **supabase.com/dashboard** → New Project
2. Choose region: **South Asia (Mumbai)** — closest to Gujarat, India
3. Set a strong database password (save it securely)
4. Wait for the project to initialise (~2 minutes)

---

## Step 2 — Configure Supabase CLI

```bash
# Login
supabase login

# Copy project reference from Supabase dashboard URL
# e.g. https://supabase.com/dashboard/project/abcdefghijklmnop

# Link to development project
cd supabase
supabase link --project-ref YOUR_DEV_PROJECT_REF

# Verify
supabase status
```

---

## Step 3 — Run Migrations (in order)

```bash
# Apply all migrations to the linked project
supabase db push

# Expected migration order:
# 20240101000000_extensions_and_enums.sql
# 20240101000001_organizations.sql
# 20240101000002_offices.sql
# 20240101000003_users.sql
# 20240101000004_complaints.sql    (includes set_complaint_number trigger)
# 20240101000005_complaint_logs.sql
# 20240101000006_notification_logs.sql
# 20240101000007_system_settings.sql
# 20240101000008_indexes.sql
# 20240101000009_rls_policies.sql
# 20240101000010_storage_policies.sql
```

Verify in Supabase Dashboard → SQL Editor:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Expected: complaints, complaint_logs, notification_logs, offices, organizations, system_settings, users
```

---

## Step 4 — Create Storage Buckets

In Supabase Dashboard → Storage → Create new bucket:

| Bucket Name | Public | Max File Size | Allowed MIME Types |
|---|---|---|---|
| `org-assets` | No | 5 MB | `image/png, image/jpeg, image/svg+xml` |
| `complaint-attachments` | No | 20 MB | `image/*, application/pdf` |

Then run storage policies from SQL Editor:
```bash
# Run the storage policies migration manually
supabase db execute --file migrations/20240101000010_storage_policies.sql
```

---

## Step 5 — Configure Auth Settings

In Supabase Dashboard → Authentication → Settings:

1. **Site URL**: `https://admin.sunrcircle.in` (or `http://localhost:3000` for dev)
2. **Redirect URLs**: Add `sunrcircle://login-callback` (for Flutter deep link)
3. **Disable email confirmations**: Toggle off (internal admin app)
4. **Disable public sign-ups**: Toggle off — users created only by Back Office
5. **JWT expiry**: 3600 seconds (1 hour)

---

## Step 6 — Run Seed Data

```bash
# Development seed (creates org, offices, sample users placeholder)
psql "postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  -f seed/dev_seed.sql

# IMPORTANT: Create auth users BEFORE running the seed script.
# The seed inserts into public.users which references auth.users.
# Use the Supabase Admin API or Dashboard → Auth → Users to create:
#   - admin@sunrcircle.in (back_office)
#   - manager@sunrcircle.in (top_management)
#   - cc@sunrcircle.in (call_centre)
#   - lineman@sunrcircle.in (line_man)
# Then update the UUIDs in dev_seed.sql to match.
```

---

## Step 7 — Deploy Edge Functions

```bash
# Deploy all three functions
supabase functions deploy complaint-number-validator --project-ref YOUR_PROJECT_REF
supabase functions deploy notification-dispatcher --project-ref YOUR_PROJECT_REF
supabase functions deploy report-generator --project-ref YOUR_PROJECT_REF

# Set secrets for production
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
  --project-ref YOUR_PROJECT_REF
```

---

## Step 8 — Verify RLS Policies

Run the verification queries from SQL Editor:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All rows should have rowsecurity = true

-- Check all policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Should see 18+ policies across 7 tables
```

---

## GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret | Description |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | From supabase.com/dashboard/account/tokens |
| `STAGING_SUPABASE_PROJECT_REF` | Staging project reference ID |
| `PROD_SUPABASE_PROJECT_REF` | Production project reference ID |
| `STAGING_SUPABASE_URL` | `https://xxx.supabase.co` |
| `STAGING_SUPABASE_ANON_KEY` | Staging anon key |
| `PROD_SUPABASE_URL` | Production URL |
| `PROD_SUPABASE_ANON_KEY` | Production anon key |
