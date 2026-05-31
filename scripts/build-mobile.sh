#!/usr/bin/env bash
# build-mobile.sh — Build the Flutter mobile app for a target environment.
# Usage: bash scripts/build-mobile.sh [staging|prod] [apk|appbundle]

set -euo pipefail

ENV=${1:-staging}
TYPE=${2:-apk}
BUILD_NUMBER=${BUILD_NUMBER:-1}
VERSION="1.0.0"

cd apps/mobile

ENV_FILE=".env.$ENV"
[ ! -f "$ENV_FILE" ] && { echo "Error: $ENV_FILE not found"; exit 1; }

echo "[INFO] Building Flutter $TYPE for $ENV (version $VERSION+$BUILD_NUMBER)..."

flutter clean
flutter pub get

if [ "$TYPE" = "apk" ]; then
  flutter build apk --release \
    --dart-define-from-file="$ENV_FILE" \
    --build-name="$VERSION" \
    --build-number="$BUILD_NUMBER"
  echo "[INFO] APK: build/app/outputs/flutter-apk/app-release.apk"

elif [ "$TYPE" = "appbundle" ]; then
  flutter build appbundle --release \
    --dart-define-from-file="$ENV_FILE" \
    --build-name="$VERSION" \
    --build-number="$BUILD_NUMBER" \
    --obfuscate \
    --split-debug-info=build/debug-info/
  echo "[INFO] Bundle: build/app/outputs/bundle/release/app-release.aab"

else
  echo "Usage: $0 [staging|prod] [apk|appbundle]"
  exit 1
fi

echo "[INFO] Build complete."
