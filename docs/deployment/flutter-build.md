# Flutter Build & Release Guide

Step-by-step guide to build and release the SUNR Circle mobile app.

---

## Prerequisites

- Flutter 3.19+ (stable channel)
- Android Studio / Android SDK
- Java 17+
- A Syncfusion Community License key

---

## Step 1 — Syncfusion License

1. Register at [syncfusion.com/products/communitylicense](https://www.syncfusion.com/products/communitylicense)
2. Get your license key
3. Add to `lib/main.dart` before `WidgetsFlutterBinding.ensureInitialized()`:

```dart
// In lib/main.dart, add at the very top of main():
import 'package:syncfusion_flutter_core/theme.dart';

Future<void> main() async {
  SyncfusionLicense.registerLicense('YOUR_LICENSE_KEY_HERE');
  WidgetsFlutterBinding.ensureInitialized();
  // ...
}
```

---

## Step 2 — Create Release Keystore (One-Time)

**Never commit the keystore file or key.properties to git.**

```bash
cd apps/mobile/android

keytool -genkey -v \
  -keystore sunrcircle-release.jks \
  -alias sunrcircle \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS
```

Fill in the prompts:
- First/Last Name: SUNR Circle
- Organisation Unit: IT Department
- Organisation: SUNR Circle Electricity Utility
- City: Gandhinagar
- State: Gujarat
- Country: IN

---

## Step 3 — Configure Signing

Create `apps/mobile/android/key.properties` (gitignored):

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=sunrcircle
storeFile=sunrcircle-release.jks
```

Update `apps/mobile/android/app/build.gradle` — add before `android {}`:

```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android { buildTypes { release { ... } } }`:

```groovy
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
    }
}
```

---

## Step 4 — Environment Files

Create environment files for each target:

**`apps/mobile/.env.staging`**
```
SUPABASE_URL=https://YOUR-STAGING-REF.supabase.co
SUPABASE_ANON_KEY=staging-anon-key
ENVIRONMENT=staging
APP_VERSION=1.0.0
SUPPORT_EMAIL=support@sunrcircle.in
```

**`apps/mobile/.env.production`**
```
SUPABASE_URL=https://YOUR-PROD-REF.supabase.co
SUPABASE_ANON_KEY=production-anon-key
ENVIRONMENT=production
APP_VERSION=1.0.0
SUPPORT_EMAIL=support@sunrcircle.in
```

---

## Step 5 — Build Commands

```bash
cd apps/mobile

# Clean first
flutter clean && flutter pub get

# Staging APK (for testing)
flutter build apk --release \
  --dart-define-from-file=.env.staging \
  --build-name=1.0.0 \
  --build-number=1

# Output: build/app/outputs/flutter-apk/app-release.apk

# Production App Bundle (for Play Store)
flutter build appbundle --release \
  --dart-define-from-file=.env.production \
  --build-name=1.0.0 \
  --build-number=1 \
  --obfuscate \
  --split-debug-info=build/debug-info/

# Output: build/app/outputs/bundle/release/app-release.aab
```

---

## Step 6 — Play Store Upload

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app: SUNR Circle
3. Upload the `.aab` file under Release → Production
4. Fill in store listing (description, screenshots)
5. Submit for review

---

## CI/CD (GitHub Actions)

The `ci-mobile.yml` workflow automatically:
- Runs `flutter analyze` on every PR
- Builds a staging APK when `develop` is pushed
- Uploads the APK as a GitHub Actions artifact (14-day retention)

For production builds, run manually from your machine using the commands above.

---

## Increment Version

Update `version` in `apps/mobile/pubspec.yaml`:
```yaml
version: 1.0.1+2  # format: major.minor.patch+buildNumber
```

The build number must be incremented for every Play Store upload.
