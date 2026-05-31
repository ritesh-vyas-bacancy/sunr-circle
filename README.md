# SUNR Circle — Complaint Management System

> Production-grade, multi-platform complaint management solution for the SUNR Circle electricity utility organisation.

[![CI Admin](https://github.com/sunr-circle/sunr-circle/actions/workflows/ci-admin.yml/badge.svg)](https://github.com/sunr-circle/sunr-circle/actions/workflows/ci-admin.yml)
[![CI Mobile](https://github.com/sunr-circle/sunr-circle/actions/workflows/ci-mobile.yml/badge.svg)](https://github.com/sunr-circle/sunr-circle/actions/workflows/ci-mobile.yml)

---

## Overview

The SUNR Circle Complaint Management System digitises the complaint intake and resolution workflow previously handled through Google Forms. The system consists of:

| Component | Technology | Purpose |
|---|---|---|
| **Admin Panel** | Next.js 15, TypeScript, ShadCN UI | Back Office management, user administration, reporting |
| **Mobile App** | Flutter, Riverpod, GoRouter | Field staff (Call Centre, Line Man) and Top Management |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) | Data, authentication, business logic |

---

## Repository Structure

```
sunr-circle/
├── apps/
│   ├── admin/          # Next.js 15 Admin Panel
│   └── mobile/         # Flutter Mobile Application
├── supabase/
│   ├── migrations/     # Ordered SQL migration files
│   ├── functions/      # Deno Edge Functions
│   ├── seed/           # Development seed data
│   └── tests/          # RLS policy tests
├── docs/
│   ├── deployment/     # Step-by-step deployment guides
│   └── architecture/   # System design documents
├── scripts/            # Developer utility scripts
└── .github/            # CI/CD workflows, PR templates
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- Flutter 3.19+
- Supabase CLI (`npm i -g supabase`)
- Docker Desktop (for local Supabase)

### 1. Clone and install

```bash
git clone https://github.com/sunr-circle/sunr-circle.git
cd sunr-circle

# Admin panel
cd apps/admin && npm install

# Mobile app
cd ../mobile && flutter pub get
```

### 2. Start local Supabase

```bash
cd supabase
supabase start
supabase db push          # runs all migrations
psql "..." -f seed/dev_seed.sql
```

### 3. Configure environment

```bash
# Admin panel
cp apps/admin/.env.example apps/admin/.env.local
# Fill in the local Supabase URL and keys from `supabase status`

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
# Fill in the same local Supabase URL and anon key
```

### 4. Run

```bash
# Admin panel
cd apps/admin && npm run dev

# Mobile (in a new terminal)
cd apps/mobile && flutter run --dart-define-from-file=.env
```

---

## User Roles

| Role | Platform | Capabilities |
|---|---|---|
| **Back Office** | Admin Panel | Full system management: users, offices, complaints, reports |
| **Top Management** | Admin Panel + Mobile | Read-only view of all complaints; reports; statistics |
| **Call Centre** | Mobile | Create complaints, view history in their Sub Division |
| **Line Man** | Mobile | Accept open complaints, update status, add remarks |

---

## Office Hierarchy

```
Circle Office
└── Division Office (many per Circle)
    └── Sub Division Office (many per Division)
        ├── Call Centre Users (belong to one Sub Division)
        └── Line Men (belong to one Sub Division)
```

---

## Complaint Workflow

```
Created (Open) → Assigned → In Progress → Closed
                          ↘ Rejected
```

Closed and Rejected are terminal states — they cannot be reopened.

---

## Documentation

| Document | Description |
|---|---|
| [Phase 1 Architecture](PHASE1_ARCHITECTURE.md) | Full system design, database schema, RLS policies |
| [Supabase Setup](docs/deployment/supabase-setup.md) | Step-by-step Supabase deployment guide |
| [Vercel Setup](docs/deployment/vercel-setup.md) | Admin panel deployment to Vercel |
| [Flutter Build](docs/deployment/flutter-build.md) | Android APK / App Bundle release guide |
| [Admin Panel README](apps/admin/README.md) | Admin panel specific documentation |
| [Mobile App README](apps/mobile/README.md) | Flutter mobile app documentation |

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — 2 reviewer approvals required |
| `develop` | Staging integration — 1 reviewer approval |
| `feature/SUNR-*` | Feature development, branched from `develop` |
| `hotfix/SUNR-*` | Critical production fixes, branched from `main` |

Commit messages follow **Conventional Commits**: `feat(admin): add complaint filter`.

---

## Tech Stack Summary

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadCN UI, TanStack Table
- **Mobile**: Flutter 3.x, Riverpod 2.x, GoRouter, Dio, EasyLocalization, Supabase Flutter
- **Backend**: Supabase (PostgreSQL 15, Auth, Storage, Edge Functions/Deno)
- **CI/CD**: GitHub Actions, Vercel (admin), Supabase CLI (migrations)
- **Localisation**: English + Gujarati (gu)

---

## License

Proprietary — SUNR Circle Electricity Utility. All rights reserved.
