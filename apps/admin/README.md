# SUNR Circle Admin Panel

Next.js 15 App Router web application for Back Office and Top Management users.

## Stack

- **Next.js 15** (App Router, React Server Components, Server Actions)
- **TypeScript 5** (strict mode)
- **Tailwind CSS + ShadCN UI** (government blue theme)
- **Supabase** (PostgreSQL, Auth, Storage)
- **NextAuth v5** (JWT sessions, credentials provider)
- **TanStack Table** (server-side pagination)
- **React Hook Form + Zod** (type-safe forms)
- **ExcelJS + jsPDF** (report exports)

## Development

```bash
# Install
npm install

# Copy env
cp .env.example .env.local
# Edit .env.local with your Supabase and NextAuth values

# Run dev server
npm run dev           # http://localhost:3000

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Regenerate Supabase types
npm run db:types
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — **never expose to browser** |
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_URL` | Yes | App URL (e.g. `https://admin.sunrcircle.in`) |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Forgot Password (no layout)
│   ├── (dashboard)/     # All protected pages with sidebar layout
│   └── api/             # API routes (NextAuth, export)
├── features/            # Feature-first modules
│   ├── auth/            # Authentication
│   ├── complaints/      # Complaint management
│   ├── offices/         # Circle/Division/Sub Division CRUD
│   ├── users/           # User management
│   ├── organisation/    # Organisation settings
│   └── reports/         # Report builder + exports
├── components/
│   ├── ui/              # ShadCN primitives
│   └── shared/          # Sidebar, DataTable, StatusBadge, etc.
├── lib/                 # Supabase clients, auth config, utils
├── hooks/               # useUrlParams, useToast
└── types/               # database.types.ts, next-auth.d.ts
```

## Roles & Access

| Route | back_office | top_management |
|---|---|---|
| `/dashboard` | Full stats | Full stats |
| `/organisation` | Edit | Read-only |
| `/offices/*` | Full CRUD | — |
| `/users/*` | Full CRUD | Read-only |
| `/complaints/*` | Full CRUD + assign | Read-only |
| `/reports` | Generate + export | Generate + export |
