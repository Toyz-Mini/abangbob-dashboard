#!/bin/bash
# Build script for AbangBob multi-app variants
# Usage: ./build-app.sh [admin|pos|manager|staff]

set -e

APP_VARIANT=$1

if [ -z "$APP_VARIANT" ]; then
  echo "Usage: ./build-app.sh [admin|pos|manager|staff]"
  exit 1
fi

echo "🚀 Building AbangBob $APP_VARIANT..."

# Step 1: Build Next.js
echo "📦 Building Next.js..."
npm run build

# Step 2: Copy the correct capacitor config
echo "📋 Copying capacitor.config.$APP_VARIANT.ts..."
cp "capacitor.config.$APP_VARIANT.ts" capacitor.config.ts

# Step 3: Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync android

echo "✅ Build complete! Open Android Studio to generate APK:"
echo "   Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "APK will be named: AbangBob $(echo $APP_VARIANT | sed 's/.*/\u&/')"
