# Vercel Deployment Guide

Step-by-step guide to deploy the SUNR Circle Admin Panel to Vercel.

---

## Prerequisites

- Vercel account at [vercel.com](https://vercel.com)
- GitHub repository connected to Vercel
- Supabase projects set up (see [supabase-setup.md](supabase-setup.md))

---

## Step 1 — Import Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **Import Git Repository** → choose `sunr-circle`
3. Framework Preset: **Next.js** (auto-detected)
4. Root Directory: `apps/admin`
5. Build Command: `npm run build` (default)
6. Output Directory: `.next` (default)

---

## Step 2 — Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables.

Set each variable for **Production**, **Preview**, and **Development** as appropriate:

### Production Variables
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-PROD-REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key |
| `AUTH_SECRET` | Run `openssl rand -base64 32` |
| `AUTH_URL` | `https://admin.sunrcircle.in` |
| `NEXT_PUBLIC_APP_NAME` | `SUNR Circle Admin` |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` |
| `NEXT_PUBLIC_ORG_ASSETS_BUCKET` | `org-assets` |
| `NEXT_PUBLIC_COMPLAINT_ATTACHMENTS_BUCKET` | `complaint-attachments` |

### Preview (Staging) Variables
Same as production but pointing to your staging Supabase project.
Set `NEXT_PUBLIC_ENVIRONMENT` to `staging`.

---

## Step 3 — Configure Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `admin.sunrcircle.in`
3. Add CNAME record at your DNS provider:
   - **Name**: `admin`
   - **Value**: `cname.vercel-dns.com`
4. For staging: add `admin-staging.sunrcircle.in`

Wait for DNS propagation (up to 48 hours, usually minutes).

---

## Step 4 — Configure Branch Deployments

In Vercel Dashboard → Project → Settings → Git:

| Branch | Deployment | Domain |
|---|---|---|
| `main` | Production | `admin.sunrcircle.in` |
| `develop` | Preview (Staging) | `admin-staging.sunrcircle.in` |
| `feature/*` | Preview | Auto-generated URL |

---

## Step 5 — Verify Deployment

After the first deployment completes:

```bash
# Check the deployment
curl -I https://admin.sunrcircle.in

# Expected headers:
# HTTP/2 200
# x-content-type-options: nosniff
# x-frame-options: DENY
# content-security-policy: ...
```

Visit `https://admin.sunrcircle.in/login` and verify:
- Login page loads correctly
- SUNR Circle branding appears
- Login with a seeded user works

---

## GitHub Secrets for CI/CD

Add these to GitHub Secrets for the deploy workflows:

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | From vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From Vercel account settings |
| `VERCEL_PROJECT_ID` | From Vercel project settings |

---

## Troubleshooting

**Build fails: `Cannot find module '@/lib/...'`**
→ Check that the root directory is set to `apps/admin` in Vercel settings.

**Auth redirect loop**
→ Verify `AUTH_URL` matches the exact domain (no trailing slash).

**Supabase connection error**
→ Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.
