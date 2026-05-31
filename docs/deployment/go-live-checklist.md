# Go-Live Checklist

Complete this checklist before promoting to production. Every item must be ✅ before go-live.

---

## Pre-Launch (1 week before)

### Supabase Production
- [ ] Production Supabase project created in `ap-south-1` region
- [ ] All 10 migrations run successfully on production
- [ ] RLS verification queries confirm all 18+ policies active
- [ ] Both storage buckets created (`org-assets`, `complaint-attachments`)
- [ ] Storage policies applied
- [ ] All 3 Edge Functions deployed to production
- [ ] Edge Function secrets set (SUPABASE_SERVICE_ROLE_KEY)
- [ ] Auth public signup disabled
- [ ] Auth email confirmations disabled
- [ ] JWT expiry set to 3600 seconds
- [ ] Site URL set to `https://admin.sunrcircle.in`
- [ ] Flutter redirect URL added: `sunrcircle://login-callback`

### Organisation Setup
- [ ] Organization record inserted: SUNR Circle (code: SUNR)
- [ ] Circle created
- [ ] Divisions created (at least 2)
- [ ] Sub Divisions created (at least 4)
- [ ] System settings seeded (SLA threshold, default locale)

### User Accounts
- [ ] Back Office admin user created and tested
- [ ] Top Management user created and tested
- [ ] At least one Call Centre user created per Sub Division
- [ ] At least one Line Man assigned per Sub Division
- [ ] All user passwords communicated securely (not via email plaintext)
- [ ] All users can log in and reach their role home screen

### Admin Panel (Vercel Production)
- [ ] Production deployment live at `admin.sunrcircle.in`
- [ ] HTTPS certificate active (automatic via Vercel)
- [ ] All environment variables set in Vercel production environment
- [ ] Login with back_office user → reaches Dashboard
- [ ] Security headers present (check via browser DevTools → Network → Response Headers)
- [ ] Create a test complaint end-to-end ✅
- [ ] Assign complaint to a Line Man ✅
- [ ] Generate Excel report ✅
- [ ] Generate PDF report ✅

### Mobile App
- [ ] Syncfusion license key registered in `main.dart`
- [ ] Production `.env.production` file created with production Supabase credentials
- [ ] Production APK built with `--dart-define-from-file=.env.production`
- [ ] Keystore backed up securely (off-site, separate from source code)
- [ ] APK tested on Android device — all 3 roles functional
- [ ] Call Centre: create complaint, view history ✅
- [ ] Line Man: accept complaint, update status ✅
- [ ] Top Management: dashboard stats load ✅
- [ ] Language switch (EN ↔ GU) works ✅

### CI/CD
- [ ] GitHub repository created and code pushed to `main`
- [ ] Branch protection on `main` (2 approvals required)
- [ ] Branch protection on `develop` (1 approval required)
- [ ] GitHub environments created: `staging`, `production`
- [ ] Production environment requires manual approval
- [ ] All GitHub Secrets set (Vercel, Supabase, Android keystore)
- [ ] `ci-admin` workflow passes on `main`
- [ ] `ci-mobile` workflow passes on `main`
- [ ] `deploy-production` workflow tested and successful

---

## Launch Day

- [ ] Final smoke test on production with real user accounts
- [ ] Verify complaint number format: `SUNR-XXXXXX-FC12345`
- [ ] Verify audit log created after status change in complaint_logs
- [ ] Verify organisation logo uploads to `org-assets` bucket
- [ ] Communicate go-live to all users with credentials and quick-start guide
- [ ] Monitor Supabase logs for errors during first hour of use
- [ ] Monitor Vercel analytics for any 500 errors

---

## Post-Launch (Day 1)

- [ ] Check complaint_logs table — entries being created on every status change
- [ ] Verify all user roles can perform their designated actions
- [ ] Confirm no RLS policy violations in Supabase logs
- [ ] Back up the production database: Supabase Dashboard → Database → Backups

---

## Known Phase 2 Items (Not in Phase 5 Scope)

These are intentionally deferred and do not block go-live:

- [ ] SMS/WhatsApp/Email notification integration (notification_dispatcher is stubbed)
- [ ] Push notifications (Firebase Messaging commented out in pubspec.yaml)
- [ ] iOS App Store build (Android only for Phase 1)
- [ ] Advanced analytics (Syncfusion reports in mobile are placeholder)

---

*Last updated: Phase 6 delivery — 2026-05-31*
