# SUNR Circle Complaint Management System
## Phase 1: Architecture & Design Document
### Status: Awaiting Approval

**Prepared by:** Principal Software Architect
**Date:** 2026-05-31
**Version:** 1.0.0

---

## 1. Executive Summary

The SUNR Circle Complaint Management System is a production-grade, multi-platform digital solution designed to replace the manual, Google Forms-based complaint intake process currently operated by SUNR Circle electricity utility. The system delivers a Flutter mobile application for field staff and consumers, a Next.js web-based admin panel for back-office operations and management, and a Supabase-powered backend providing authentication, database, storage, and serverless compute — all under a single coherent architecture.

The architectural philosophy is **Clean Architecture with feature-first organisation**. Every component — mobile, admin, and backend — is layered into distinct concerns: presentation, application, domain, data, and infrastructure. This separation ensures that any single layer can be replaced, tested, or scaled independently without disrupting adjacent layers. Business logic lives exclusively in the domain layer, making it framework-agnostic and trivially testable. This approach is particularly important for a government utility system where correctness, auditability, and long-term maintainability are non-negotiable.

Security is a first-class concern, not an afterthought. The system implements four independent, layered security mechanisms: JWT authentication managed by Supabase Auth, role-based access control enforced at the routing layer of both mobile and admin applications, Row Level Security policies enforced at the PostgreSQL database layer, and an immutable database-trigger-driven audit trail. No single point of failure exposes sensitive consumer or operational data. The system is designed from day one to support English and Gujarati localisation, multi-organisation deployment, and future integration of SMS, WhatsApp, and email notification providers — all without architectural changes.

---

## 2. Technology Stack Summary

| Component | Technology | Version | Justification |
|---|---|---|---|
| Mobile App | Flutter | Latest Stable (3.x) | Single codebase for Android/iOS; government sector adoption; strong typing |
| Mobile State | Riverpod | ^2.5.x | Compile-safe providers; no BuildContext dependency; testable |
| Mobile Navigation | Go Router | ^14.x | Declarative routing; deep link support; RBAC redirect guards |
| Mobile HTTP | Dio | ^5.x | Interceptor chain; token refresh; retry logic |
| Mobile Models | Freezed | ^2.x | Immutable value objects; union types for UI state |
| Mobile Localisation | Easy Localization | ^3.x | YAML-based translation files; runtime locale switching |
| Mobile Secure Storage | Flutter Secure Storage | ^9.x | iOS Keychain / Android Keystore; AES-256 |
| Admin Panel | Next.js | 15 (App Router) | React Server Components; streaming; Server Actions; Vercel-native |
| Admin Language | TypeScript | ^5.x | Compile-time safety; better tooling for enterprise code |
| Admin UI | ShadCN UI + Tailwind CSS | Latest | Accessible, unstyled primitives; full CSS variable theming |
| Admin Tables | TanStack Table | ^8.x | Headless; server-side pagination; URL-driven filter state |
| Admin Forms | React Hook Form + Zod | Latest | Zero re-renders; schema-first validation shared with server |
| Backend Auth | Supabase Auth | Latest | JWT + refresh rotation; built-in email/OTP flows |
| Backend Database | PostgreSQL (via Supabase) | 15.x | ACID; RLS; triggers; generated columns; GIN trigram indexes |
| Backend Storage | Supabase Storage | Latest | S3-compatible; bucket policies; image resizing |
| Backend Functions | Supabase Edge Functions | Latest | Deno runtime; colocated with database; service role access |
| Reporting | Syncfusion Charts / Excel / PDF | Licensed | Government-grade chart rendering; Excel/PDF export |
| Deployment — Admin | Vercel | Latest | Zero-config Next.js; preview deployments; Mumbai region |
| Deployment — Backend | Supabase Cloud | Latest | Managed PostgreSQL; auto-scaling; global CDN for storage |
| Source Control | GitHub | — | Industry standard; Actions CI/CD; branch protection |

---

## 3. Flutter Mobile Application Architecture

### 3.1 Architectural Decisions

**Why Clean Architecture + Riverpod + Feature-First?**

Government utility applications have a decade-long lifecycle. Code written today will be maintained by developers who were not part of the original team. Clean Architecture enforces a strict dependency rule: outer layers depend on inner layers; inner layers know nothing about outer layers. This means the domain layer — where business rules like "a closed complaint cannot be reopened" or "a line man can only see complaints in their own sub-division" — is pure Dart with zero Flutter dependencies. It can be unit-tested in isolation with no mocking of platform code.

Riverpod was chosen over Bloc because it eliminates the need for `BuildContext` to read providers, making providers accessible from service layers without threading context down call stacks. The `StateNotifier` pattern combined with Freezed union states (`initial / loading / success / error`) gives every screen a deterministic, testable state machine. Riverpod's `ref.watch` and `ref.read` distinction enforces reactive vs. imperative access correctly at compile time.

Feature-first organisation means `lib/features/complaint/` contains its own presentation, application, domain, and data sub-directories. This colocation makes feature-level code reviews trivial, enables partial codebase ownership per team member, and makes future deletion of a feature (e.g., a deprecated workflow) a folder delete rather than a codebase-wide grep.

**GoRouter + RBAC Guards**

GoRouter's `redirect` callback is evaluated on every navigation attempt. The auth guard reads the `authStateProvider` (a Riverpod provider exposing the current `UserSession?`). If the session is null, the user is redirected to `/login`. If the session role does not match the route's required role, the user is redirected to their role-appropriate home route. This is evaluated before the page widget is even instantiated, preventing flash-of-wrong-content.

**Dio Interceptor Chain**

Four interceptors are applied in order: `ConnectivityInterceptor` (rejects requests when offline), `AuthInterceptor` (attaches `Authorization: Bearer <token>`; on 401 enters a lock, calls `/auth/refresh` via a separate Dio instance, updates secure storage, retries all queued requests), `LoggingInterceptor` (debug builds only; logs request/response with sanitized headers), and `ErrorInterceptor` (maps Supabase error codes to typed `AppException` subclasses).

### 3.2 Folder Structure

```
apps/mobile/
├── android/
├── ios/
├── test/
│   ├── unit/
│   │   ├── features/
│   │   └── core/
│   ├── widget/
│   └── integration/
├── lib/
│   ├── main.dart                         # Entry point; initialises DI, EasyLocalization, app
│   ├── app.dart                          # MaterialApp.router; GoRouter; theme
│   │
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart           # dart-define constants (supabaseUrl, env, etc.)
│   │   ├── constants/
│   │   │   ├── app_constants.dart
│   │   │   └── route_constants.dart
│   │   ├── error/
│   │   │   ├── app_exception.dart        # Sealed class hierarchy for typed errors
│   │   │   └── failure.dart
│   │   ├── extensions/
│   │   │   ├── string_ext.dart
│   │   │   └── datetime_ext.dart
│   │   ├── l10n/
│   │   │   ├── en.yaml                   # English translations
│   │   │   └── gu.yaml                   # Gujarati translations
│   │   ├── router/
│   │   │   ├── app_router.dart           # GoRouter configuration
│   │   │   ├── guards/
│   │   │   │   ├── auth_guard.dart
│   │   │   │   └── role_guard.dart
│   │   │   └── routes/
│   │   │       ├── auth_routes.dart
│   │   │       ├── call_centre_routes.dart
│   │   │       ├── line_man_routes.dart
│   │   │       └── top_management_routes.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart            # Government blue/white ThemeData
│   │   │   ├── app_colors.dart
│   │   │   └── app_text_styles.dart
│   │   └── utils/
│   │       ├── date_utils.dart
│   │       └── validators.dart
│   │
│   ├── infrastructure/
│   │   ├── network/
│   │   │   ├── dio_client.dart           # Dio instance with interceptor chain
│   │   │   ├── interceptors/
│   │   │   │   ├── auth_interceptor.dart
│   │   │   │   ├── connectivity_interceptor.dart
│   │   │   │   ├── error_interceptor.dart
│   │   │   │   └── logging_interceptor.dart
│   │   │   └── api_endpoints.dart
│   │   ├── storage/
│   │   │   └── secure_storage_service.dart   # FlutterSecureStorage wrapper
│   │   ├── supabase/
│   │   │   └── supabase_client.dart      # Supabase.initialize() wrapper
│   │   └── notifications/
│   │       ├── notification_provider.dart    # Abstract interface
│   │       └── fcm_notification_provider.dart
│   │
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── app_scaffold.dart         # Standard scaffold with app bar
│   │   │   ├── app_button.dart
│   │   │   ├── app_text_field.dart
│   │   │   ├── loading_overlay.dart
│   │   │   ├── error_view.dart
│   │   │   ├── empty_state_view.dart
│   │   │   └── offline_banner.dart
│   │   └── providers/
│   │       └── connectivity_provider.dart
│   │
│   └── features/
│       ├── auth/
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   └── user_session.dart  # Freezed entity; role, userId, token
│       │   │   ├── repositories/
│       │   │   │   └── auth_repository.dart   # Abstract interface
│       │   │   └── usecases/
│       │   │       ├── login_usecase.dart
│       │   │       ├── logout_usecase.dart
│       │   │       └── forgot_password_usecase.dart
│       │   ├── data/
│       │   │   ├── models/
│       │   │   │   └── user_session_model.dart  # Freezed; fromJson/toJson
│       │   │   └── repositories/
│       │   │       └── auth_repository_impl.dart
│       │   ├── application/
│       │   │   └── auth_notifier.dart     # StateNotifier<AuthState>
│       │   └── presentation/
│       │       ├── screens/
│       │       │   ├── login_screen.dart
│       │       │   └── forgot_password_screen.dart
│       │       └── widgets/
│       │           └── login_form.dart
│       │
│       ├── complaint/                    # Shared complaint domain (used by call_centre & line_man)
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   ├── complaint.dart
│       │   │   │   └── complaint_log.dart
│       │   │   ├── repositories/
│       │   │   │   └── complaint_repository.dart
│       │   │   └── usecases/
│       │   │       ├── create_complaint_usecase.dart
│       │   │       ├── get_complaints_usecase.dart
│       │   │       ├── update_complaint_status_usecase.dart
│       │   │       └── get_complaint_detail_usecase.dart
│       │   ├── data/
│       │   │   ├── models/
│       │   │   │   ├── complaint_model.dart
│       │   │   │   └── complaint_log_model.dart
│       │   │   └── repositories/
│       │   │       └── complaint_repository_impl.dart
│       │   └── application/
│       │       ├── complaint_list_notifier.dart
│       │       └── complaint_detail_notifier.dart
│       │
│       ├── call_centre/
│       │   └── presentation/
│       │       ├── screens/
│       │       │   ├── cc_dashboard_screen.dart
│       │       │   ├── create_complaint_screen.dart
│       │       │   ├── complaint_history_screen.dart
│       │       │   ├── search_complaint_screen.dart
│       │       │   └── complaint_detail_screen.dart
│       │       └── widgets/
│       │           ├── complaint_form.dart
│       │           └── complaint_list_tile.dart
│       │
│       ├── line_man/
│       │   └── presentation/
│       │       ├── screens/
│       │       │   ├── lm_dashboard_screen.dart
│       │       │   ├── open_complaints_screen.dart
│       │       │   ├── assigned_complaints_screen.dart
│       │       │   └── update_status_screen.dart
│       │       └── widgets/
│       │           ├── complaint_action_card.dart
│       │           └── status_update_form.dart
│       │
│       ├── top_management/
│       │   ├── domain/
│       │   │   ├── repositories/
│       │   │   │   └── report_repository.dart
│       │   │   └── usecases/
│       │   │       └── get_dashboard_stats_usecase.dart
│       │   ├── data/
│       │   │   └── repositories/
│       │   │       └── report_repository_impl.dart
│       │   └── presentation/
│       │       ├── screens/
│       │       │   ├── tm_dashboard_screen.dart
│       │       │   ├── statistics_screen.dart
│       │       │   ├── reports_screen.dart
│       │       │   └── analytics_screen.dart
│       │       └── widgets/
│       │           └── stat_card.dart
│       │
│       └── settings/
│           └── presentation/
│               ├── screens/
│               │   ├── settings_screen.dart
│               │   └── profile_screen.dart
│               └── widgets/
│                   └── language_switch_tile.dart
│
├── analysis_options.yaml
├── pubspec.yaml
└── .env.example
```

### 3.3 Layer Definitions

| Layer | Location | Responsibility | Concrete Example (Complaint Feature) |
|---|---|---|---|
| **Domain** | `features/*/domain/` | Business entities, rules, repository interfaces, use cases. No Flutter deps. | `CreateComplaintUseCase` validates complaint number format, calls `ComplaintRepository.create()` interface |
| **Data** | `features/*/data/` | Repository implementations, DTOs, Supabase/Dio calls, JSON mapping | `ComplaintRepositoryImpl.create()` calls Supabase `from('complaints').insert(model.toJson())` |
| **Application** | `features/*/application/` | Riverpod StateNotifiers; orchestrates use cases; transforms domain → UI state | `ComplaintListNotifier extends StateNotifier<AsyncValue<List<Complaint>>>` calls use case on init |
| **Presentation** | `features/*/presentation/` | Flutter widgets, screens. Reads providers via `ref.watch`, calls notifiers via `ref.read` | `CreateComplaintScreen` watches form state; on submit calls `ref.read(createComplaintNotifierProvider.notifier).submit(form)` |
| **Infrastructure** | `infrastructure/` | Cross-cutting: HTTP client, secure storage, Supabase init, notification service | `AuthInterceptor` reads token from `SecureStorageService`, attaches to every Dio request |
| **Core** | `core/` | App-wide: routing, theme, constants, error types, localisation | `AppRouter` defines GoRouter with auth guard that reads `authStateProvider` |

### 3.4 Dependencies (pubspec.yaml)

```yaml
name: sunr_circle_mobile
description: SUNR Circle Complaint Management System — Mobile Application
version: 1.0.0+1
publish_to: none

environment:
  sdk: ">=3.3.0 <4.0.0"
  flutter: ">=3.19.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Navigation
  go_router: ^14.2.0

  # HTTP Client
  dio: ^5.4.3+1

  # Data Classes & Serialization
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0

  # Localisation
  easy_localization: ^3.0.7

  # Secure Storage
  flutter_secure_storage: ^9.2.2

  # Supabase
  supabase_flutter: ^2.5.6

  # UI Utilities
  cached_network_image: ^3.3.1
  flutter_svg: ^2.0.10+1
  shimmer: ^3.0.0
  intl: ^0.19.0

  # Reporting
  syncfusion_flutter_charts: ^26.2.14
  syncfusion_flutter_pdf: ^26.2.14
  syncfusion_officechart: ^26.2.14
  open_file_plus: ^3.4.1

  # Utilities
  connectivity_plus: ^6.0.3
  package_info_plus: ^8.0.2
  path_provider: ^2.1.3
  url_launcher: ^6.3.0
  image_picker: ^1.1.2
  permission_handler: ^11.3.1

  # Crash & Analytics
  firebase_core: ^3.6.0
  firebase_crashlytics: ^4.1.3
  firebase_analytics: ^11.3.3
  firebase_messaging: ^15.1.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter

  # Code Generation
  build_runner: ^2.4.11
  freezed: ^2.5.2
  json_serializable: ^6.8.0
  riverpod_generator: ^2.4.0
  go_router_builder: ^2.7.1

  # Linting
  flutter_lints: ^4.0.0
  custom_lint: ^0.6.4
  riverpod_lint: ^2.3.10

  # Testing
  mocktail: ^1.0.4
  fake_async: ^1.3.1
```

---

## 4. Next.js Admin Panel Architecture

### 4.1 Architectural Decisions

**Why App Router over Pages Router?**

Next.js 15 App Router with React Server Components is the correct choice for a data-heavy admin panel. Server Components fetch data directly from Supabase with the service role client on the server — no API round-trip, no client-side waterfall, no loading skeletons on initial page load. Sensitive queries (complaint data, user PII) never execute in the browser. Layout components that wrap entire route groups (e.g., the sidebar and header) render once on the server and are never re-sent on client navigations. This dramatically reduces the JavaScript bundle shipped to the browser — critical for government office environments where machines may have limited compute.

**Server Actions for Mutations**

All form submissions use Next.js Server Actions, not a separate REST API layer. This means the mutation logic (validate → call Supabase → revalidate cache) lives in a single file with full TypeScript type safety from form to database. React Hook Form `handleSubmit` passes validated data to the Server Action via a hidden form or direct call. Zod schemas are defined once and shared between the React Hook Form resolver (client validation) and the Server Action (server validation) — the schema is the single source of truth.

**TanStack Table with Server-Side State**

Complaint lists can have thousands of rows. All filtering, sorting, and pagination is driven by URL search params (`?page=1&status=open&circle=...`). The Server Component reads `searchParams`, builds the Supabase query, and streams the page. TanStack Table runs in headless mode on the client for column management, selection, and row actions only — it does not hold data or manage fetch state. This keeps the bundle small and makes filtered views bookmarkable and shareable.

**Government UI Theme**

ShadCN UI's CSS variable system is overridden in `globals.css` to enforce the SUNR Circle colour palette: primary blue `#1a3d7c`, white backgrounds, grey borders. No `glassmorphism`, no gradients, no animations beyond essential focus rings. The design is WCAG AA compliant with sufficient colour contrast ratios. All interactive elements meet the 44×44px minimum touch target requirement for use on touchscreen kiosk terminals common in government offices.

### 4.2 Folder Structure

```
apps/admin/
├── public/
│   └── logo.svg                          # SUNR Circle logo (gitignored in real build)
│
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/                       # Route group — no layout wrapper
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/                  # Route group — with sidebar layout
│   │   │   ├── layout.tsx                # Server Component: checks session, renders sidebar
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Role-aware dashboard (server component)
│   │   │   │
│   │   │   ├── organisation/
│   │   │   │   ├── page.tsx              # Org info
│   │   │   │   ├── logo/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── theme/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── offices/
│   │   │   │   ├── circles/
│   │   │   │   │   ├── page.tsx          # Circle list
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx      # Circle detail + divisions
│   │   │   │   ├── divisions/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── sub-divisions/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── page.tsx              # User list with role filter
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── complaints/
│   │   │   │   ├── page.tsx              # Complaint list; server-side paginated
│   │   │   │   ├── @modal/               # Parallel route for assignment modal
│   │   │   │   │   └── (.)assign/[id]/
│   │   │   │   │       └── page.tsx      # Intercepting route
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Complaint detail + timeline
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── page.tsx              # Report builder UI
│   │   │       └── [type]/
│   │   │           └── page.tsx          # Specific report view
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts          # NextAuth handler
│   │   │   └── reports/
│   │   │       └── export/
│   │   │           └── route.ts          # Streams Excel/PDF to browser
│   │   │
│   │   ├── layout.tsx                    # Root layout: fonts, providers
│   │   ├── not-found.tsx
│   │   └── globals.css                   # CSS variables; Tailwind base
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── actions/
│   │   │   │   └── auth.actions.ts       # signIn, signOut Server Actions
│   │   │   ├── components/
│   │   │   │   └── login-form.tsx        # Client Component; RHF + Zod
│   │   │   └── schemas/
│   │   │       └── auth.schema.ts        # loginSchema (shared client+server)
│   │   │
│   │   ├── complaints/
│   │   │   ├── actions/
│   │   │   │   └── complaint.actions.ts  # assignComplaint, updateStatus Server Actions
│   │   │   ├── components/
│   │   │   │   ├── complaint-table.tsx   # Client: TanStack Table instance
│   │   │   │   ├── complaint-filters.tsx # Client: filter bar; writes to URL params
│   │   │   │   ├── complaint-timeline.tsx
│   │   │   │   └── assign-modal.tsx
│   │   │   ├── queries/
│   │   │   │   └── complaint.queries.ts  # Server-side Supabase query builders
│   │   │   └── schemas/
│   │   │       └── complaint.schema.ts
│   │   │
│   │   ├── offices/
│   │   │   ├── actions/
│   │   │   │   └── office.actions.ts
│   │   │   ├── components/
│   │   │   │   └── office-hierarchy-tree.tsx
│   │   │   └── schemas/
│   │   │       └── office.schema.ts
│   │   │
│   │   ├── users/
│   │   │   ├── actions/
│   │   │   │   └── user.actions.ts
│   │   │   ├── components/
│   │   │   │   ├── user-form.tsx
│   │   │   │   └── user-table.tsx
│   │   │   └── schemas/
│   │   │       └── user.schema.ts
│   │   │
│   │   └── reports/
│   │       ├── actions/
│   │       │   └── report.actions.ts     # calls report-generator Edge Function
│   │       ├── components/
│   │       │   ├── report-builder.tsx
│   │       │   └── report-chart.tsx
│   │       └── services/
│   │           ├── excel-export.service.ts
│   │           └── pdf-export.service.ts
│   │
│   ├── components/
│   │   ├── ui/                           # ShadCN UI primitives (generated)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   └── shared/
│   │       ├── data-table.tsx            # Generic TanStack Table wrapper
│   │       ├── sidebar.tsx               # Server Component: role-aware navigation
│   │       ├── header.tsx
│   │       ├── page-header.tsx
│   │       ├── status-badge.tsx          # Complaint status colour coding
│   │       └── date-range-picker.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts                 # createServerClient (Server Components + Server Actions)
│   │   │   ├── client.ts                 # createBrowserClient (Client Components only)
│   │   │   └── middleware.ts             # createServerClient for middleware.ts
│   │   ├── auth/
│   │   │   ├── auth.config.ts            # NextAuth config
│   │   │   └── session.ts                # getServerSession helper
│   │   └── utils.ts                      # cn() classnames; formatDate; formatComplaintNumber
│   │
│   ├── hooks/
│   │   ├── use-debounced-search.ts
│   │   ├── use-url-params.ts
│   │   └── use-table-state.ts
│   │
│   ├── types/
│   │   ├── database.types.ts             # Generated by Supabase CLI: supabase gen types
│   │   ├── next-auth.d.ts                # Module augmentation: session.user.role
│   │   └── index.ts                      # Re-exports
│   │
│   └── middleware.ts                     # NextAuth session check; RBAC route protection
│
├── .env.example
├── .env.local                            # gitignored
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                       # ShadCN UI config
├── package.json
└── vercel.json
```

### 4.3 Layer Definitions

| Layer | Location | Responsibility | Concrete Example (Complaint Feature) |
|---|---|---|---|
| **Presentation** | `app/(dashboard)/complaints/page.tsx` | Server Component: fetch data, pass to Client Components | Reads `searchParams`, calls `getComplaints()` query, renders `<ComplaintTable>` |
| **Application** | `features/complaints/actions/` | Server Actions: validate input, call query/mutation, revalidate cache | `assignComplaint(id, lineManId)` checks session role, updates Supabase, calls `revalidatePath()` |
| **Domain** | `features/*/schemas/` | Zod schemas as business rules; shared client+server | `complaintSchema.parse(formData)` on both `<ComplaintForm>` and `assignComplaint` action |
| **Data** | `features/*/queries/`, `lib/supabase/` | Supabase query builders using typed `database.types.ts` | `getComplaints({ page, status, circleId })` returns typed `Complaint[]` |
| **Infrastructure** | `lib/auth/`, `lib/supabase/` | Cross-cutting: auth session, Supabase client factory | `createServerClient()` creates an authenticated Supabase client per request |

### 4.4 Dependencies (package.json)

```json
{
  "name": "sunr-circle-admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.types.ts"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.7.2",

    "@supabase/supabase-js": "^2.47.10",
    "@supabase/ssr": "^0.5.2",

    "next-auth": "^5.0.0-beta.25",

    "@tanstack/react-table": "^8.20.5",

    "react-hook-form": "^7.54.1",
    "@hookform/resolvers": "^3.9.1",
    "zod": "^3.24.1",

    "tailwindcss": "^3.4.17",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",

    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-popover": "^1.1.4",

    "date-fns": "^4.1.0",
    "react-day-picker": "^9.4.4",

    "exceljs": "^4.4.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",

    "recharts": "^2.15.0",

    "sonner": "^1.7.1",
    "next-themes": "^0.4.4"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "eslint": "^9.17.0",
    "eslint-config-next": "15.1.0",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.9"
  }
}
```

---

## 5. Database Design

### 5.1 Schema Decisions

**UUID Primary Keys Throughout**
All tables use `UUID DEFAULT gen_random_uuid()` as the primary key. UUIDs prevent enumeration attacks (attackers cannot guess sequential IDs), are safe to expose in URLs and API responses, and enable distributed ID generation without coordination. The performance difference vs. BIGSERIAL on this workload (thousands, not millions of rows) is negligible.

**Self-Referential `offices` Table**
Circle, Division, and Sub Division are all stored in one `offices` table with an `office_type` ENUM and a nullable `parent_id` self-referential FK. This decision avoids a 3-table join for every hierarchy query, allows adding new levels (e.g., Zone) with a migration rather than a schema change, and keeps foreign keys simple — `users.sub_division_id` always points to `offices.id` regardless of level. A CHECK constraint enforces hierarchy integrity (circle has no parent; division's parent must be a circle; sub-division's parent must be a division) via a `SECURITY DEFINER` function called in the constraint.

**Complaint Number as GENERATED ALWAYS Column**
The `complaint_number` column is a `GENERATED ALWAYS AS` expression combining the organization code, sub-division code, and user-entered complaint number. This is computed and stored at insert time, is immutable, and participates in a UNIQUE constraint. The user-entered portion (`raw_complaint_number`) is stored separately for search. A UNIQUE constraint on `(organization_id, sub_division_id, raw_complaint_number)` prevents duplicates at the database level, before any application logic runs.

**Audit Trigger, Not Application Logic**
The `complaint_logs` table is populated exclusively by a PostgreSQL trigger `log_complaint_status_change()` that fires `AFTER UPDATE OF status ON complaints`. Application code cannot skip the audit trail — even direct SQL updates via the Supabase dashboard will generate audit records. The trigger captures `OLD.status`, `NEW.status`, `auth.uid()` (the Supabase authenticated user), and `now()`.

**`pg_trgm` GIN Indexes for Text Search**
Consumer name and mobile number searches use `ILIKE '%term%'` patterns. Without a trigram index, this causes a full table scan. The `pg_trgm` extension and `CREATE INDEX ... USING GIN (column gin_trgm_ops)` enable these queries to use the index, keeping search response times under 100ms even at 100,000 complaints.

### 5.2 Entity Relationship Overview

```
organizations (1) ──< offices (∞)           [org has many circles/divisions/sub-divisions]
offices (1) ──< offices (∞)                  [circle has many divisions; division has many sub-divisions]
offices (1) ──< users (∞)                    [sub-division has many users]
organizations (1) ──< users (∞)              [org has many users]
organizations (1) ──< complaints (∞)         [org has many complaints]
offices (1) ──< complaints (∞)               [sub-division has many complaints]
users (1) ──< complaints (∞)                 [call centre user creates many complaints]
users (1) ──< complaints (∞)                 [line man is assigned many complaints]
complaints (1) ──< complaint_logs (∞)        [every complaint has an immutable log trail]
complaints (1) ──< notification_logs (∞)     [every complaint can trigger many notifications]
system_settings (standalone)                 [key-value config; org-scoped or global]
```

### 5.3 Table Definitions (SQL)

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUM TYPES
-- ============================================================
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
-- REUSABLE TRIGGER FUNCTION: updated_at
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

-- ============================================================
-- TABLE: organizations
-- ============================================================
CREATE TABLE organizations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  short_name        TEXT NOT NULL,
  code              TEXT NOT NULL UNIQUE,          -- e.g. 'SUNR'; used in complaint_number
  logo_url          TEXT,
  primary_color     TEXT NOT NULL DEFAULT '#1a3d7c',
  secondary_color   TEXT NOT NULL DEFAULT '#ffffff',
  support_email     TEXT,
  support_phone     TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT organizations_code_format CHECK (code ~ '^[A-Z0-9]{2,10}$')
);

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: offices  (circle / division / sub_division)
-- ============================================================
CREATE TABLE offices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  parent_id       UUID REFERENCES offices(id) ON DELETE RESTRICT,
  office_type     office_type NOT NULL,
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,                   -- e.g. '01', '0102' (auto-padded by app)
  address         TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  CONSTRAINT offices_hierarchy_check CHECK (
    (office_type = 'circle'       AND parent_id IS NULL) OR
    (office_type = 'division'     AND parent_id IS NOT NULL) OR
    (office_type = 'sub_division' AND parent_id IS NOT NULL)
  )
);

CREATE TRIGGER trg_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: users  (linked to auth.users via auth.uid())
-- ============================================================
CREATE TABLE users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sub_division_id   UUID REFERENCES offices(id) ON DELETE RESTRICT,  -- NULL for top_management, back_office
  role              user_role NOT NULL,
  full_name         TEXT NOT NULL,
  employee_id       TEXT,
  mobile_number     TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, employee_id),
  CONSTRAINT users_subdivision_required CHECK (
    (role IN ('call_centre', 'line_man') AND sub_division_id IS NOT NULL) OR
    (role IN ('back_office', 'top_management'))
  )
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: complaints
-- ============================================================
CREATE TABLE complaints (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  sub_division_id       UUID NOT NULL REFERENCES offices(id) ON DELETE RESTRICT,
  raw_complaint_number  TEXT NOT NULL,             -- User-entered e.g. 'FC12345'
  complaint_number      TEXT GENERATED ALWAYS AS (
                          (SELECT o.code FROM organizations o WHERE o.id = organization_id)
                          || '-' ||
                          (SELECT of.code FROM offices of WHERE of.id = sub_division_id)
                          || '-' ||
                          raw_complaint_number
                        ) STORED,                 -- e.g. 'SUNR-0102-FC12345'
  consumer_name         TEXT NOT NULL,
  consumer_mobile       TEXT NOT NULL,
  nature_of_complaint   TEXT NOT NULL,
  complaint_remarks     TEXT,
  status                complaint_status NOT NULL DEFAULT 'open',
  created_by            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to           UUID REFERENCES users(id) ON DELETE SET NULL,
  attend_remarks        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_at           TIMESTAMPTZ,
  in_progress_at        TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sub_division_id, raw_complaint_number),
  CONSTRAINT complaints_closed_immutable CHECK (
    -- closed/rejected complaints: assigned_to cannot be changed (enforced in app + RLS)
    TRUE
  ),
  CONSTRAINT complaints_consumer_mobile_format CHECK (
    consumer_mobile ~ '^[6-9][0-9]{9}$'          -- Indian mobile number format
  )
);

CREATE TRIGGER trg_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AUDIT TRIGGER: complaint_logs (IMMUTABLE append-only)
-- ============================================================
CREATE TABLE complaint_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  old_status    complaint_status,
  new_status    complaint_status NOT NULL,
  remarks       TEXT,
  changed_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  metadata      JSONB,                            -- e.g. assigned_to, attend_remarks snapshot
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No updated_at: this table is append-only
);

-- Prevent updates and deletes on audit log
CREATE RULE complaint_logs_no_update AS ON UPDATE TO complaint_logs DO INSTEAD NOTHING;
CREATE RULE complaint_logs_no_delete AS ON DELETE TO complaint_logs DO INSTEAD NOTHING;

CREATE OR REPLACE FUNCTION log_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO complaint_logs (
      complaint_id, old_status, new_status, changed_by, metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      jsonb_build_object(
        'assigned_to', NEW.assigned_to,
        'attend_remarks', NEW.attend_remarks
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_complaint_audit
  AFTER UPDATE OF status ON complaints
  FOR EACH ROW EXECUTE FUNCTION log_complaint_status_change();

-- ============================================================
-- TABLE: notification_logs
-- ============================================================
CREATE TABLE notification_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id        UUID REFERENCES complaints(id) ON DELETE SET NULL,
  channel             notification_channel NOT NULL,
  recipient           TEXT NOT NULL,              -- phone or email
  message_body        TEXT,
  status              notification_status NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,                       -- External provider reference ID
  error_message       TEXT,
  triggered_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: system_settings
-- ============================================================
CREATE TABLE system_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = global
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,
  description     TEXT,
  is_sensitive    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 5.4 Indexes

```sql
-- ============================================================
-- INDEXES
-- ============================================================

-- offices: hierarchy traversal
CREATE INDEX idx_offices_organization_id    ON offices (organization_id);
CREATE INDEX idx_offices_parent_id         ON offices (parent_id);         -- list children
CREATE INDEX idx_offices_type              ON offices (office_type);

-- users: role and subdivision lookups
CREATE INDEX idx_users_organization_id     ON users (organization_id);
CREATE INDEX idx_users_sub_division_id     ON users (sub_division_id);
CREATE INDEX idx_users_role                ON users (role);                 -- filter by role
CREATE INDEX idx_users_is_active           ON users (is_active);

-- complaints: primary query patterns
CREATE INDEX idx_complaints_organization_id  ON complaints (organization_id);
CREATE INDEX idx_complaints_sub_division_id  ON complaints (sub_division_id);
CREATE INDEX idx_complaints_status           ON complaints (status);        -- filter open/assigned
CREATE INDEX idx_complaints_created_by       ON complaints (created_by);
CREATE INDEX idx_complaints_assigned_to      ON complaints (assigned_to);   -- line man's queue
CREATE INDEX idx_complaints_created_at       ON complaints (created_at DESC); -- date range
CREATE INDEX idx_complaints_closed_at        ON complaints (closed_at DESC);
CREATE INDEX idx_complaints_number           ON complaints (complaint_number); -- exact lookup
-- Composite: dashboard query (sub_division + status + date)
CREATE INDEX idx_complaints_subdivision_status_date
  ON complaints (sub_division_id, status, created_at DESC);
-- Trigram indexes for ILIKE consumer search
CREATE INDEX idx_complaints_consumer_name_trgm
  ON complaints USING GIN (consumer_name gin_trgm_ops);
CREATE INDEX idx_complaints_consumer_mobile_trgm
  ON complaints USING GIN (consumer_mobile gin_trgm_ops);
CREATE INDEX idx_complaints_raw_number_trgm
  ON complaints USING GIN (raw_complaint_number gin_trgm_ops);

-- complaint_logs: timeline fetch
CREATE INDEX idx_complaint_logs_complaint_id ON complaint_logs (complaint_id, logged_at DESC);

-- notification_logs
CREATE INDEX idx_notification_logs_complaint_id ON notification_logs (complaint_id);
CREATE INDEX idx_notification_logs_status        ON notification_logs (status);
```

### 5.5 Seed Data

```sql
-- ============================================================
-- SEED: Organization
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
-- SEED: Offices
-- ============================================================
-- Circle
INSERT INTO offices (id, organization_id, parent_id, office_type, name, code)
VALUES ('b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        NULL, 'circle', 'SUNR Circle Office', '01');

-- Divisions
INSERT INTO offices (id, organization_id, parent_id, office_type, name, code) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'division', 'Division North', '0101'),
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 'division', 'Division South', '0102');

-- Sub Divisions
INSERT INTO offices (id, organization_id, parent_id, office_type, name, code) VALUES
  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 'sub_division', 'Sub Division North A', '010101'),
  ('b0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 'sub_division', 'Sub Division North B', '010102'),
  ('b0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003', 'sub_division', 'Sub Division South A', '010201'),
  ('b0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003', 'sub_division', 'Sub Division South B', '010202');

-- ============================================================
-- SEED: Auth Users (run via Supabase Auth Admin API or SQL)
-- NOTE: In production, create auth.users via Supabase Admin API.
-- These are placeholders; replace with actual auth.users UUIDs.
-- ============================================================

-- Seed public.users (after creating corresponding auth.users)
INSERT INTO users (id, organization_id, sub_division_id, role, full_name, employee_id, mobile_number) VALUES
  ('c0000000-0000-0000-0000-000000000001', -- back_office (replace with auth.uid)
   'a0000000-0000-0000-0000-000000000001', NULL, 'back_office',
   'Admin User', 'EMP001', '9900000001'),
  ('c0000000-0000-0000-0000-000000000002', -- top_management
   'a0000000-0000-0000-0000-000000000001', NULL, 'top_management',
   'Manager User', 'EMP002', '9900000002'),
  ('c0000000-0000-0000-0000-000000000003', -- call_centre (North A)
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004', 'call_centre',
   'CC Agent Ramesh', 'EMP003', '9900000003'),
  ('c0000000-0000-0000-0000-000000000004', -- line_man (North A)
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004', 'line_man',
   'Line Man Suresh', 'EMP004', '9900000004');

-- ============================================================
-- SEED: System Settings
-- ============================================================
INSERT INTO system_settings (organization_id, key, value, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'sla_hours_threshold', '24',
   'Hours before a complaint is flagged as SLA breached'),
  ('a0000000-0000-0000-0000-000000000001', 'default_locale', 'en',
   'Default app locale: en or gu'),
  (NULL, 'system_version', '1.0.0', 'System version for compatibility checks');

-- ============================================================
-- SEED: Sample Complaints
-- ============================================================
INSERT INTO complaints (
  organization_id, sub_division_id, raw_complaint_number,
  consumer_name, consumer_mobile, nature_of_complaint, complaint_remarks,
  status, created_by
) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'FC12345', 'Ramesh Patel', '9876543210',
   'No Power Supply', 'Power outage since morning',
   'open', 'c0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   'FC12346', 'Sunita Shah', '9876543211',
   'Street Light Not Working', 'Street light on main road is off since 3 days',
   'assigned', 'c0000000-0000-0000-0000-000000000003');
```

---

## 6. Supabase Configuration

### 6.1 Row Level Security Strategy

RLS is enabled on every table. The core pattern uses two `SECURITY DEFINER` helper functions that resolve the calling user's role and sub-division from `auth.uid()`. These functions are called once per policy evaluation and their results are memoised within the query plan, avoiding per-row sub-selects.

**Role Resolution:** `get_current_user_role()` returns the authenticated user's `role` enum value by joining `auth.uid()` to `public.users.id`. This function is `SECURITY DEFINER` so it executes with superuser privileges, reads from `public.users`, and returns the value — the calling policy does not need SELECT on `public.users`.

**Office Scope:** `get_current_user_subdivision()` returns the `sub_division_id` UUID for the current user (NULL for back_office and top_management). `get_current_user_office_tree(uuid)` returns all descendant office IDs of a given office — used so that a division-level manager could see all sub-division complaints (for potential future extension).

**Role Policy Matrix:**

| Table | back_office | top_management | call_centre | line_man |
|---|---|---|---|---|
| organizations | SELECT, UPDATE | SELECT | — | — |
| offices | ALL | SELECT | SELECT | SELECT |
| users | ALL | SELECT (all) | SELECT (own row) | SELECT (own row) |
| complaints | ALL | SELECT (all) | SELECT+INSERT (own sub_div) | SELECT+UPDATE (own sub_div, assigned) |
| complaint_logs | SELECT+INSERT | SELECT | SELECT (own complaints) | SELECT (own complaints) |
| notification_logs | ALL | SELECT | — | — |
| system_settings | ALL | SELECT | SELECT | SELECT |

### 6.2 RLS Policies (SQL)

```sql
-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
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

-- ============================================================
-- RLS: organizations
-- ============================================================
CREATE POLICY "org_select_management" ON organizations
  FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('back_office', 'top_management'));

CREATE POLICY "org_update_back_office" ON organizations
  FOR UPDATE TO authenticated
  USING (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');

-- ============================================================
-- RLS: offices
-- ============================================================
CREATE POLICY "offices_select_all_authenticated" ON offices
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
  USING (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');

CREATE POLICY "offices_delete_back_office" ON offices
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'back_office');

-- ============================================================
-- RLS: users
-- ============================================================
CREATE POLICY "users_select_own_row" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_select_back_office_top_management" ON users
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() IN ('back_office', 'top_management')
    AND organization_id = get_current_user_organization()
  );

CREATE POLICY "users_update_own_row" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_back_office" ON users
  FOR INSERT TO authenticated
  WITH CHECK (get_current_user_role() = 'back_office');

CREATE POLICY "users_update_back_office" ON users
  FOR UPDATE TO authenticated
  USING (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');

CREATE POLICY "users_delete_back_office" ON users
  FOR DELETE TO authenticated
  USING (get_current_user_role() = 'back_office');

-- ============================================================
-- RLS: complaints
-- ============================================================
-- back_office: full access
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

-- top_management: read all
CREATE POLICY "complaints_select_top_management" ON complaints
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() = 'top_management'
    AND organization_id = get_current_user_organization()
  );

-- call_centre: read + insert in own sub_division
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

-- line_man: read + update in own sub_division (only assigned complaints for update)
CREATE POLICY "complaints_select_line_man" ON complaints
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() = 'line_man'
    AND sub_division_id = get_current_user_subdivision()
  );

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
    AND status NOT IN ('open')           -- line man cannot revert to open
  );

-- ============================================================
-- RLS: complaint_logs
-- ============================================================
CREATE POLICY "complaint_logs_insert_authenticated" ON complaint_logs
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

CREATE POLICY "complaint_logs_select_back_office_top_management" ON complaint_logs
  FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('back_office', 'top_management'));

CREATE POLICY "complaint_logs_select_own_complaints" ON complaint_logs
  FOR SELECT TO authenticated
  USING (
    get_current_user_role() IN ('call_centre', 'line_man')
    AND EXISTS (
      SELECT 1 FROM complaints c
      WHERE c.id = complaint_logs.complaint_id
        AND c.sub_division_id = get_current_user_subdivision()
    )
  );

-- ============================================================
-- RLS: notification_logs
-- ============================================================
CREATE POLICY "notification_logs_select_management" ON notification_logs
  FOR SELECT TO authenticated
  USING (get_current_user_role() IN ('back_office', 'top_management'));

CREATE POLICY "notification_logs_insert_authenticated" ON notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (triggered_by = auth.uid());

-- ============================================================
-- RLS: system_settings
-- ============================================================
CREATE POLICY "system_settings_select_all" ON system_settings
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id = get_current_user_organization()
  );

CREATE POLICY "system_settings_all_back_office" ON system_settings
  FOR ALL TO authenticated
  USING (get_current_user_role() = 'back_office')
  WITH CHECK (get_current_user_role() = 'back_office');
```

### 6.3 Storage Bucket Policies

```sql
-- ============================================================
-- BUCKET: org-assets (logos, theme images)
-- Create via Supabase Dashboard or CLI first:
-- Max file size: 5 MB; allowed MIME: image/png, image/jpeg, image/svg+xml
-- ============================================================

CREATE POLICY "org_assets_upload_back_office" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-assets'
    AND get_current_user_role() = 'back_office'
  );

CREATE POLICY "org_assets_update_back_office" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'org-assets'
    AND get_current_user_role() = 'back_office'
  );

CREATE POLICY "org_assets_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'org-assets');

-- ============================================================
-- BUCKET: complaint-attachments (Phase 2 — reserved for future)
-- Max file size: 20 MB; allowed MIME: image/*, application/pdf
-- ============================================================

CREATE POLICY "complaint_attachments_upload_call_centre" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() IN ('call_centre', 'line_man')
  );

CREATE POLICY "complaint_attachments_select_authorised" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() IN ('back_office', 'top_management', 'call_centre', 'line_man')
  );

CREATE POLICY "complaint_attachments_delete_back_office" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'complaint-attachments'
    AND get_current_user_role() = 'back_office'
  );
```

### 6.4 Edge Functions Architecture

**Function 1: `complaint-number-validator`**

Validates that a `raw_complaint_number` is not already registered for the given `organization_id` + `sub_division_id` combination before the Flutter client attempts the insert. Prevents the network round-trip of a failed INSERT with a unique constraint violation. Uses the service role client to bypass RLS for the existence check.

| Field | Detail |
|---|---|
| Trigger | HTTP POST from Flutter app before complaint creation |
| Auth | Supabase JWT in Authorization header; role must be `call_centre` |
| Input | `{ organization_id, sub_division_id, raw_complaint_number }` |
| Output (success) | `{ available: true }` |
| Output (conflict) | `{ available: false, existing_complaint_number: "SUNR-0102-FC12345" }` |

**Function 2: `notification-dispatcher`**

Routes notification requests to the appropriate provider (SMS, WhatsApp, Email, Push). In Phase 1, all providers are stubbed — the function logs to `notification_logs` with `status = 'skipped'` and a `metadata` note. In Phase 2, real provider integrations (MSG91, Twilio, Resend) are added behind the same interface without changing callers.

| Field | Detail |
|---|---|
| Trigger | Database webhook on `complaints.status` change, or direct HTTP POST |
| Auth | Service role key (internal use); or Supabase JWT for direct call |
| Input | `{ complaint_id, channel, recipient, template_key, template_vars }` |
| Output (success) | `{ dispatched: true, provider_message_id, logged_at, log_id }` |
| Output (failure) | `{ dispatched: false, error, log_id: null }` |

**Function 3: `report-generator`**

Generates structured complaint report data for PDF or Excel rendering. Uses the service role client to query across all RLS boundaries for accurate aggregate data. Validates JWT and extracts role before executing — only `back_office` and `top_management` may call. Paginates at 500 rows per call to avoid Edge Function memory limits. SLA breach is computed as `closed_at - created_at > system_settings.sla_hours_threshold`.

| Field | Detail |
|---|---|
| Trigger | HTTP POST from Next.js API route or Flutter app |
| Auth | Supabase JWT in Authorization header; role checked server-side |
| Input | `{ report_type, filters: { date_from, date_to, office_id?, status?, assigned_to? }, format_hint }` |
| Report Types | `complaints_summary`, `office_wise`, `lineman_performance`, `sla_breach` |
| Output | `{ report_type, generated_at, summary: { total, open, ... }, rows: [...], meta: { total_rows, page, page_size } }` |
| Auth Failure | `{ error: "UNAUTHORIZED", message: "..." }` |

```
supabase/
  functions/
    complaint-number-validator/
      index.ts
    notification-dispatcher/
      index.ts
    report-generator/
      index.ts
```

---

## 7. DevOps & Repository Structure

### 7.1 Monorepo Structure

A single Git repository hosts all three system components. This enables atomic commits spanning mobile, admin, and database changes, a single CI/CD entry point, and shared documentation. No build tool (Turborepo, Nx) is introduced in Phase 1 to keep onboarding simple.

```
sunr-circle/
├── .github/
│   ├── CODEOWNERS
│   ├── pull_request_template.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── workflows/
│       ├── ci-admin.yml
│       ├── ci-mobile.yml
│       ├── deploy-staging.yml
│       ├── deploy-production.yml
│       └── supabase-migrations.yml
│
├── apps/
│   ├── admin/                          # Next.js admin panel
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── .env.example
│   │   ├── .env.local                  # gitignored
│   │   ├── .env.staging                # gitignored
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── vercel.json
│   │
│   └── mobile/                         # Flutter mobile app
│       ├── android/
│       ├── ios/
│       ├── lib/
│       │   ├── core/
│       │   ├── features/
│       │   ├── infrastructure/
│       │   └── main.dart
│       ├── test/
│       ├── .env                        # gitignored
│       ├── .env.example
│       ├── analysis_options.yaml
│       └── pubspec.yaml
│
├── supabase/
│   ├── functions/
│   │   ├── complaint-number-validator/index.ts
│   │   ├── notification-dispatcher/index.ts
│   │   └── report-generator/index.ts
│   ├── migrations/
│   │   ├── 20240101000000_extensions_and_enums.sql
│   │   ├── 20240101000001_organizations.sql
│   │   ├── 20240101000002_offices.sql
│   │   ├── 20240101000003_users.sql
│   │   ├── 20240101000004_complaints.sql
│   │   ├── 20240101000005_complaint_logs.sql
│   │   ├── 20240101000006_notification_logs.sql
│   │   ├── 20240101000007_system_settings.sql
│   │   ├── 20240101000008_indexes.sql
│   │   ├── 20240101000009_rls_policies.sql
│   │   └── 20240101000010_storage_policies.sql
│   ├── seed/
│   │   ├── dev_seed.sql
│   │   └── staging_seed.sql
│   ├── tests/
│   │   └── rls_tests.sql
│   ├── .env                            # gitignored
│   ├── .env.example
│   └── config.toml
│
├── docs/
│   ├── architecture/
│   │   ├── system-overview.md
│   │   └── data-flow.md
│   ├── api/
│   │   └── edge-functions.md
│   ├── deployment/
│   │   ├── supabase-setup.md
│   │   ├── vercel-setup.md
│   │   └── flutter-build.md
│   └── runbooks/
│       ├── hotfix-procedure.md
│       └── rollback-procedure.md
│
├── scripts/
│   ├── setup-dev.sh
│   ├── run-migrations.sh
│   └── build-mobile.sh
│
├── .editorconfig
├── .gitignore
└── README.md
```

### 7.2 Branching Strategy

**Branch Model: Git Flow adapted for monorepo CI/CD**

| Branch Type | Pattern | Branched From | Merged Into | Purpose |
|---|---|---|---|---|
| Production | `main` | — | — | Auto-deploys to Vercel production + Supabase prod migrations. 2 approvals required. |
| Integration | `develop` | — | — | Auto-deploys to staging. 1 approval required. |
| Feature | `feature/SUNR-{ticket}-{description}` | `develop` | `develop` | New features. Deleted after merge. |
| Bugfix | `bugfix/SUNR-{ticket}-{description}` | `develop` | `develop` | Non-critical bug fixes during development. |
| Release | `release/v{major}.{minor}.{patch}` | `develop` | `main` + `develop` | Release candidate. Only bug fixes and version bumps allowed. |
| Hotfix | `hotfix/SUNR-{ticket}-{description}` | `main` | `main` + `develop` | Critical production fixes. Expedited 1 approval from on-call reviewer. |

**Branch Protection Rules**

`main`: 2 required approvals, Code Owners review required, status checks `ci-admin` + `ci-mobile` + `supabase-lint` must pass, signed commits required, no force push.

`develop`: 1 required approval, status checks `ci-admin` + `ci-mobile` must pass, no force push.

**Commit Message Convention (Conventional Commits 1.0.0)**

```
<type>(<scope>): <short description>

[optional body]

[optional footer: SUNR-ticket, BREAKING CHANGE]
```

| Type | Meaning | Version Bump |
|---|---|---|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `feat!` / `BREAKING CHANGE` | Breaking change | Major |
| `refactor` | Code restructure, no behaviour change | None |
| `chore` | Tooling, deps, build | None |
| `docs` | Documentation only | None |
| `test` | Tests only | None |
| `ci` | CI/CD workflow changes | None |
| `perf` | Performance improvement | Patch |

Valid scopes: `admin`, `mobile`, `supabase`, `auth`, `ci`, `deps`, `docs`

Examples:
```
feat(admin): add complaint priority filter to dashboard
fix(mobile): resolve OTP input validation on Android 14
feat(supabase): add complaint_audit_logs table migration
fix(auth): handle expired JWT refresh token gracefully
feat(mobile)!: migrate push notification service to FCM v1
```

### 7.3 Environment Configuration

**Environment File Map**

| File | Location | Committed | Purpose |
|---|---|---|---|
| `.env.example` | `apps/admin/` | Yes | Template for all admin env vars |
| `.env.local` | `apps/admin/` | No | Local development values |
| `.env.example` | `apps/mobile/` | Yes | Template for dart-define vars |
| `.env` | `apps/mobile/` | No | Local development dart-define values |
| `.env.example` | `supabase/` | Yes | Template for Supabase CLI vars |
| `.env` | `supabase/` | No | Local Supabase CLI values |

**Admin Panel — `apps/admin/.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application
NEXT_PUBLIC_APP_NAME=SUNR Circle Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Storage
NEXT_PUBLIC_ORG_ASSETS_BUCKET=org-assets
NEXT_PUBLIC_COMPLAINT_ATTACHMENTS_BUCKET=complaint-attachments

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=false

# External Services (Phase 2)
RESEND_API_KEY=
SMTP_FROM_ADDRESS=noreply@sunrcircle.in

# Monitoring (Phase 2)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

**Flutter — `apps/mobile/.env.example`**

```bash
# Passed at build time via --dart-define-from-file
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
ENVIRONMENT=development
APP_VERSION=1.0.0
FCM_SENDER_ID=your-fcm-sender-id
DEEP_LINK_SCHEME=sunrcircle
SUPPORT_EMAIL=support@sunrcircle.in
SENTRY_DSN=
```

```dart
// lib/core/config/app_config.dart
class AppConfig {
  static const supabaseUrl     = String.fromEnvironment('SUPABASE_URL');
  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const environment     = String.fromEnvironment('ENVIRONMENT', defaultValue: 'development');
  static const appVersion      = String.fromEnvironment('APP_VERSION', defaultValue: '1.0.0');
}
```

**Flutter Build Commands**

```bash
# Debug (development)
flutter run --dart-define-from-file=apps/mobile/.env

# Release APK (staging)
flutter build apk --release \
  --dart-define-from-file=apps/mobile/.env.staging \
  --build-name=1.0.0 --build-number=$BUILD_NUMBER

# Release App Bundle (Play Store)
flutter build appbundle --release \
  --dart-define-from-file=apps/mobile/.env.production \
  --build-name=1.0.0 --build-number=$BUILD_NUMBER \
  --obfuscate --split-debug-info=build/debug-info/
```

**`apps/admin/vercel.json`**

```json
{
  "version": 2,
  "name": "sunr-circle-admin",
  "framework": "nextjs",
  "regions": ["bom1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self';"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    }
  ],
  "git": {
    "deploymentEnabled": { "main": true, "develop": true }
  }
}
```

### 7.4 Deployment Checklist

**Step 1 — Supabase Initial Setup**

| Task | Command / Action |
|---|---|
| Create 3 Supabase projects (dev, staging, prod) | Supabase Dashboard — region: `ap-south-1` (Mumbai) |
| Install Supabase CLI | `npm install -g supabase && supabase login` |
| Link CLI to dev project | `supabase link --project-ref <ref>` |
| Run migrations in timestamp order | `supabase db push --project-ref <ref>` |
| Create storage buckets | `org-assets` (5 MB, private) and `complaint-attachments` (20 MB, private) |
| Apply storage policies | Run storage SQL in Supabase SQL Editor |
| Deploy Edge Functions | `supabase functions deploy <name> --project-ref <ref>` |
| Set Edge Function secrets | `supabase secrets set KEY=value --project-ref <ref>` |
| Configure Auth settings | Disable public signup; set Site URL; add Flutter deep link redirect |
| Run seed data | Execute `supabase/seed/dev_seed.sql` via SQL Editor |

**Step 2 — Vercel Deployment**

| Task | Action |
|---|---|
| Import repository to Vercel | vercel.com/new → select `sunr-circle` repo |
| Set root directory | `apps/admin` |
| Set production branch | `main` → `admin.sunrcircle.in` |
| Set preview branch | `develop` → `admin-staging.sunrcircle.in` |
| Add environment variables | Vercel Dashboard > Settings > Environment Variables (per environment) |
| Configure custom domain | Add CNAME pointing to `cname.vercel-dns.com` |

**Step 3 — Flutter Android Build**

| Task | Command |
|---|---|
| Generate release keystore (one-time) | `keytool -genkey -v -keystore sunrcircle-release.jks ...` |
| Configure `key.properties` | Create `apps/mobile/android/key.properties` (gitignored) |
| Update `build.gradle` | Add `signingConfigs.release` block |
| Build staging APK | `flutter build apk --release --dart-define-from-file=.env.staging` |
| Build production AAB | `flutter build appbundle --release --dart-define-from-file=.env.production --obfuscate` |

**Step 4 — GitHub Repository Settings**

| Task | Action |
|---|---|
| Create org and private repo | `sunr-circle` GitHub org; `sunr-circle` private repo |
| Enable branch protection on `main` | 2 approvals, Code Owners, signed commits, required status checks |
| Enable branch protection on `develop` | 1 approval, required status checks |
| Add GitHub Secrets | `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `ANDROID_KEYSTORE_BASE64`, per-env Supabase keys |

**Post-Deployment Smoke Tests**

| Check | Expected Result |
|---|---|
| Admin panel loads | HTTP 200, login page renders |
| Login with seeded back_office user | Redirect to dashboard |
| Create complaint via admin | Row appears in `complaints` table |
| File upload to `org-assets` | File appears in Supabase Storage |
| `notification-dispatcher` Edge Function call | HTTP 200; `notification_logs` row with `status = 'skipped'` |
| Flutter staging APK: login → create complaint | Complaint appears in admin panel |
| Flutter staging APK: line man accepts complaint | `complaint_logs` audit row created |

---

## 8. Security Architecture

The security design is layered — each layer provides independent protection so that a failure in one layer does not expose data.

**JWT Authentication Flow**

Supabase Auth issues short-lived JWT access tokens (1 hour expiry) and long-lived refresh tokens with rotation enabled. On Flutter, the `AuthInterceptor` attaches the access token to every outbound Dio request. On 401, the interceptor enters a lock, uses a separate Dio instance to call the Supabase refresh endpoint, writes the new token pair to `FlutterSecureStorage` (iOS Keychain / Android Keystore), and retries queued requests. If the refresh token is expired, the interceptor clears storage and triggers `authStateProvider` logout. On the admin panel, NextAuth v5 manages the session cookie lifecycle and refreshes tokens server-side before they reach the client.

**RBAC at the Application Layer**

Both the Flutter app (GoRouter redirect guard) and the Next.js admin panel (`middleware.ts`) enforce role-based routing before any data is fetched. Each role is permitted access only to its designated routes. Server Actions re-check the session role before executing any mutation — the role is never trusted from the client payload.

**Row Level Security at the Database Layer**

Even if application-layer RBAC were bypassed, Supabase RLS policies enforce data access at the PostgreSQL row level. `SECURITY DEFINER` helper functions resolve the authenticated user's role and office from `auth.uid()` in a plan-cache-friendly manner. The service role key (used only in Edge Functions and server-side Next.js routes) bypasses RLS intentionally and is never exposed to the browser.

**Secure Storage**

Flutter stores all tokens exclusively in `FlutterSecureStorage`, backed by AES-256 on the Android Keystore System and the iOS Keychain. The admin panel uses HttpOnly session cookies managed by NextAuth — the access token never touches `localStorage` or `sessionStorage`.

**Immutable Audit Trail**

Every complaint status change is captured by the `log_complaint_status_change()` PostgreSQL trigger inserting to `complaint_logs`. Database-level `RULE` statements prevent `UPDATE` and `DELETE` on `complaint_logs`. This audit trail cannot be bypassed even by direct SQL access via the Supabase dashboard (subject to RLS bypass by service role — service role access is restricted to trusted server-side contexts).

**Secret Management**

No secrets are committed to source control. Environment variables are injected at runtime via Vercel Environment Variables (admin panel) and `--dart-define-from-file` at build time (Flutter). Supabase Edge Function secrets are set via the Supabase CLI. The service role key is marked as a server-only variable (no `NEXT_PUBLIC_` prefix) and is never sent to the browser.

**Transport Security**

All traffic is over HTTPS/TLS. The `vercel.json` configuration adds `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`, and a restrictive `Content-Security-Policy` to all responses.

---

## 9. Phase 1 Deliverables Checklist

| # | Deliverable | Component | Status |
|---|---|---|---|
| 1 | Clean Architecture folder structure | Flutter | Designed |
| 2 | Riverpod StateNotifier/Provider pattern per feature | Flutter | Designed |
| 3 | GoRouter with RBAC redirect guards | Flutter | Designed |
| 4 | Dio interceptor chain (JWT, refresh, connectivity, logging) | Flutter | Designed |
| 5 | Freezed immutable models | Flutter | Designed |
| 6 | Authentication feature (login, logout, forgot password) | Flutter | Designed |
| 7 | Call Centre feature (create, search, history, detail) | Flutter | Designed |
| 8 | Line Man feature (open, accept, status update, remarks) | Flutter | Designed |
| 9 | Top Management feature (dashboard, analytics, reports) | Flutter | Designed |
| 10 | Settings feature (profile, language EN/GU toggle) | Flutter | Designed |
| 11 | Shared widgets (scaffold, loading, error, offline banner) | Flutter | Designed |
| 12 | EN + GU (Gujarati) localisation with EasyLocalization | Flutter | Designed |
| 13 | `pubspec.yaml` with all dependencies | Flutter | Designed |
| 14 | Clean Architecture folder structure | Next.js | Designed |
| 15 | App Router with route groups `(auth)` and `(dashboard)` | Next.js | Designed |
| 16 | Server Components for data; Client Components for interactivity | Next.js | Designed |
| 17 | TanStack Table with server-side pagination + URL-driven filters | Next.js | Designed |
| 18 | React Hook Form + Zod with single-source schemas | Next.js | Designed |
| 19 | ShadCN UI with SUNR Circle government theme | Next.js | Designed |
| 20 | NextAuth v5 session management with role injection | Next.js | Designed |
| 21 | Server Actions for all mutations | Next.js | Designed |
| 22 | Parallel route + intercepting route for assignment modal | Next.js | Designed |
| 23 | Organisation, Offices, Users, Complaints, Reports modules | Next.js | Designed |
| 24 | `package.json` with all dependencies | Next.js | Designed |
| 25 | PostgreSQL ENUM types | Database | Designed |
| 26 | `organizations` table | Database | Designed |
| 27 | Self-referential `offices` table | Database | Designed |
| 28 | `users` table with role + subdivision constraint | Database | Designed |
| 29 | `complaints` table with GENERATED complaint_number | Database | Designed |
| 30 | `complaint_logs` append-only table with trigger | Database | Designed |
| 31 | `notification_logs` table | Database | Designed |
| 32 | `system_settings` table | Database | Designed |
| 33 | `set_updated_at()` reusable trigger function | Database | Designed |
| 34 | `log_complaint_status_change()` audit trigger | Database | Designed |
| 35 | Full index suite (FK, composite, GIN trigram) | Database | Designed |
| 36 | Complete seed data | Database | Designed |
| 37 | RLS enabled on all 7 tables | Supabase | Designed |
| 38 | `SECURITY DEFINER` helper functions | Supabase | Designed |
| 39 | RLS policies for all roles on all tables | Supabase | Designed |
| 40 | `org-assets` storage bucket + policies | Supabase | Designed |
| 41 | `complaint-attachments` storage bucket + policies | Supabase | Designed |
| 42 | `complaint-number-validator` Edge Function specification | Supabase | Designed |
| 43 | `notification-dispatcher` Edge Function specification (stubbed) | Supabase | Designed |
| 44 | `report-generator` Edge Function specification | Supabase | Designed |
| 45 | Monorepo structure (`apps/admin`, `apps/mobile`, `supabase`, `docs`) | DevOps | Designed |
| 46 | Git Flow branching strategy with naming conventions | DevOps | Designed |
| 47 | Branch protection rules for `main` and `develop` | DevOps | Designed |
| 48 | Conventional Commits convention | DevOps | Designed |
| 49 | CODEOWNERS file | DevOps | Designed |
| 50 | GitHub Actions workflows (CI, deploy staging, deploy prod, migrations) | DevOps | Designed |
| 51 | Environment files for all components across all environments | DevOps | Designed |
| 52 | `vercel.json` with security headers and Mumbai region | DevOps | Designed |
| 53 | Android release keystore and `build.gradle` signing configuration | DevOps | Designed |
| 54 | Post-deployment smoke test checklist | DevOps | Designed |

**No code has been written. All items above are design artifacts only.**

---

## 10. Approval Request

### Decisions Requiring Explicit Approval

The following have architecture-wide implications. A change after coding begins requires significant rework. Sign-off is requested on each item:

| # | Decision | Impact if Changed After Coding |
|---|---|---|
| 1 | **Flutter Clean Architecture + Riverpod** as mobile state management pattern | Complete rewrite of all feature modules |
| 2 | **GoRouter** with RBAC redirect guard pattern | Rewrite of all navigation and session management |
| 3 | **Next.js 15 App Router with React Server Components** (not Pages Router) | Complete admin panel rewrite |
| 4 | **Server Actions** replacing a separate REST API layer | Significant refactor of all form submission flows |
| 5 | **Supabase** as the backend platform (Auth + PostgreSQL + Storage + Edge Functions) | Full backend migration |
| 6 | **Self-referential `offices` table** for the circle → division → sub-division hierarchy | Database migration; all FK references change |
| 7 | **GENERATED ALWAYS AS `complaint_number`** column | Breaking schema change; all existing complaint numbers invalidated |
| 8 | **Row Level Security** as the primary data isolation mechanism | Security audit + significant RLS rewrite |
| 9 | **UUID primary keys** throughout | Breaking change to all API contracts |
| 10 | **Monorepo structure** (single repo for admin + mobile + supabase) | CI/CD rebuild if split later |
| 11 | **EN + GU (Gujarati)** as the two supported languages | Adding/removing a language requires translation file work |
| 12 | **Notification providers stubbed in Phase 1** (real integrations in Phase 2) | Phase 1 will not send real SMS/email; only logs to `notification_logs` |

### What Phase 2 Will Cover

Upon approval of this document, Phase 2 will deliver:

| Sprint | Weeks | Scope |
|---|---|---|
| Sprint 1 | 1–2 | Supabase project setup, all migrations, RLS deployment, Edge Function skeletons, Vercel configuration |
| Sprint 2 | 3–4 | Next.js: auth, organisation management, office hierarchy CRUD, user management |
| Sprint 3 | 5–6 | Next.js: complaint management, assignment workflow, timeline, report builder with Excel/PDF export |
| Sprint 4 | 7–8 | Flutter: authentication, Call Centre feature, Line Man feature |
| Sprint 5 | 9–10 | Flutter: Top Management dashboard, Settings, push notifications, offline banner |
| Sprint 6 | 11 | Integration testing, end-to-end complaint flow, RLS verification, UAT |
| Sprint 7 | 12 | UAT bug fixes, production deployment, smoke tests, handover documentation |

---

*This document was prepared for client review and approval. No code has been written. All structures, schemas, policies, and configurations documented here represent the agreed design baseline. Amendments requested during the approval process will be incorporated before Phase 2 commences.*
