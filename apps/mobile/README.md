# SUNR Circle Mobile App

Flutter mobile application for Call Centre users, Line Men, and Top Management.

## Stack

- **Flutter 3.19+** (null-safe Dart)
- **Riverpod 2.x** (StateNotifier, family, autoDispose)
- **GoRouter 14.x** (declarative routing, RBAC redirect guards)
- **Supabase Flutter 2.x** (Auth, database queries)
- **Easy Localization** (English + Gujarati)
- **Syncfusion Flutter Charts** (statistics screen)

## Setup

```bash
# Get dependencies
flutter pub get

# Copy env
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Run (development)
flutter run --dart-define-from-file=.env

# Analyze
flutter analyze

# Test
flutter test
```

## Build Commands

```bash
# Staging APK
flutter build apk --release \
  --dart-define-from-file=.env.staging \
  --build-name=1.0.0 --build-number=1

# Production App Bundle (Play Store)
flutter build appbundle --release \
  --dart-define-from-file=.env.production \
  --build-name=1.0.0 --build-number=1 \
  --obfuscate \
  --split-debug-info=build/debug-info/
```

## Environment Variables (dart-define)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `ENVIRONMENT` | Yes | `development` / `staging` / `production` |
| `APP_VERSION` | No | Displayed in Settings (default: `1.0.0`) |
| `SUPPORT_EMAIL` | No | Displayed in Settings |

## Localisation

Translation files are in `assets/translations/`:
- `en.yaml` — English
- `gu.yaml` — Gujarati (ગુજરાતી)

To add a new language:
1. Create `assets/translations/XX.yaml`
2. Add `Locale('XX')` to `supportedLocales` in `main.dart`
3. Add the language option in `settings_screen.dart`

## Project Structure

```
lib/
├── main.dart                    # Entry point (Supabase + EasyLocalization init)
├── app.dart                     # MaterialApp.router
├── core/
│   ├── config/app_config.dart   # dart-define constants
│   ├── constants/               # AppConstants, RouteConstants
│   ├── error/app_exception.dart # Typed exception hierarchy
│   ├── extensions/              # DateTime, String extensions
│   ├── router/app_router.dart   # GoRouter with RBAC redirect
│   └── theme/                   # AppColors, AppTheme, AppTextStyles
├── infrastructure/
│   ├── network/                 # Dio client + 4 interceptors
│   └── storage/                 # SecureStorageService
├── shared/widgets/              # AppScaffold, ComplaintStatusChip, etc.
└── features/
    ├── auth/                    # Login, session management
    ├── complaint/               # Shared complaint domain + data layer
    ├── call_centre/             # Call Centre screens
    ├── line_man/                # Line Man screens
    ├── top_management/          # Top Management screens
    └── settings/                # Profile, Language, Logout
```

## Syncfusion License

Syncfusion Community License is free for projects with revenue under $1M USD.

1. Register at [syncfusion.com/products/communitylicense](https://www.syncfusion.com/products/communitylicense)
2. Get your license key
3. Add to `main.dart` before `runApp()`:
   ```dart
   // import 'package:syncfusion_flutter_core/theme.dart';
   SyncfusionLicense.registerLicense('YOUR_LICENSE_KEY_HERE');
   ```
