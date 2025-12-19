#!/bin/bash
# Build script for AbangBob multi-app variants
# Usage: ./build-app.sh [admin|pos|manager|staff]

set -e

APP_VARIANT=$1

if [ -z "$APP_VARIANT" ]; then
  echo "Usage: ./build-app.sh [admin|pos|manager|staff]"
  exit 1
fi

# Define app names and package IDs
case $APP_VARIANT in
  admin)
    APP_NAME="AbangBob Admin"
    PACKAGE_ID="com.abangbob.admin"
    ;;
  pos)
    APP_NAME="AbangBob POS"
    PACKAGE_ID="com.abangbob.pos"
    ;;
  manager)
    APP_NAME="AbangBob Manager"
    PACKAGE_ID="com.abangbob.manager"
    ;;
  staff)
    APP_NAME="AbangBob Staff"
    PACKAGE_ID="com.abangbob.staff"
    ;;
  *)
    echo "Unknown variant: $APP_VARIANT"
    echo "Valid options: admin, pos, manager, staff"
    exit 1
    ;;
esac

echo "🚀 Building $APP_NAME ($PACKAGE_ID)..."

# Step 1: Build Next.js
echo "📦 Building Next.js..."
npm run build

# Step 2: Copy the correct capacitor config
echo "📋 Copying capacitor.config.$APP_VARIANT.ts..."
cp "capacitor.config.$APP_VARIANT.ts" capacitor.config.ts

# Step 3: Update Android strings.xml with correct app name
echo "📝 Updating Android strings.xml..."
STRINGS_FILE="android/app/src/main/res/values/strings.xml"
cat > "$STRINGS_FILE" << EOF
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">$APP_NAME</string>
    <string name="title_activity_main">$APP_NAME</string>
    <string name="package_name">$PACKAGE_ID</string>
    <string name="custom_url_scheme">$PACKAGE_ID</string>
</resources>
EOF

# Step 4: Sync Capacitor
echo "🔄 Syncing Capacitor..."
npx cap sync android

echo ""
echo "✅ Build complete for: $APP_NAME"
echo ""
echo "Next steps:"
echo "  1. Open Android Studio"
echo "  2. File > Sync Project with Gradle Files"
echo "  3. Build > Clean Project"
echo "  4. Build > Build APK(s)"
