#!/bin/bash
# build-ios-sim.sh — Build and run AautiLearn on iOS Simulator
#
# Workaround for Xcode 16.2 CoreSimulator bug where AssetCatalogSimulatorAgent
# fails to spawn via CoreSimulator (error 153). This script:
# 1. Temporarily removes Images.xcassets from the Resources build phase
# 2. Builds the project without asset catalog compilation
# 3. Manually compiles the asset catalog using --platform macosx
# 4. Copies the compiled Assets.car into the app bundle
# 5. Installs and launches on the simulator
#
# Usage: ./scripts/build-ios-sim.sh [SIMULATOR_UDID]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$MOBILE_DIR/ios"
WORKSPACE="$IOS_DIR/AautiLearn.xcworkspace"
PBXPROJ="$IOS_DIR/AautiLearn.xcodeproj/project.pbxproj"
DERIVED_DATA="/tmp/AautiLearn-Build"
ASSETS_DIR="$IOS_DIR/AautiLearn/Images.xcassets"

# Get simulator UDID (use first booted iPhone, or boot one)
if [ -n "$1" ]; then
  SIM_UDID="$1"
else
  SIM_UDID=$(xcrun simctl list devices booted -j | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if d.get('state') == 'Booted' and 'iPhone' in d.get('name', ''):
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null)

  if [ -z "$SIM_UDID" ]; then
    echo "No booted iPhone simulator found. Booting first available..."
    SIM_UDID=$(xcrun simctl list devices available -j | python3 -c "
import json, sys
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for d in devices:
        if 'iPhone' in d.get('name', '') and d.get('isAvailable'):
            print(d['udid'])
            sys.exit(0)
" 2>/dev/null)
    if [ -z "$SIM_UDID" ]; then
      echo "❌ No iPhone simulator available. Create one in Xcode."
      exit 1
    fi
    xcrun simctl boot "$SIM_UDID" 2>/dev/null || true
    open -a Simulator
    sleep 3
  fi
fi

echo "📱 Using simulator: $SIM_UDID"
echo "🔨 Building AautiLearn..."

# Step 1: Temporarily patch project.pbxproj to remove asset catalog from Resources
# (backup first)
cp "$PBXPROJ" "$PBXPROJ.bak"

# Remove Images.xcassets from Resources build phase and ASSETCATALOG settings
python3 -c "
import re
with open('$PBXPROJ', 'r') as f:
    content = f.read()
# Remove asset catalog from Resources build phase
content = content.replace('13B07FBF1A68108700A75B9A /* Images.xcassets in Resources */,\n', '')
content = content.replace('\t\t\t\t13B07FBF1A68108700A75B9A /* Images.xcassets in Resources */,\n', '')
# Remove ASSETCATALOG_COMPILER_APPICON_NAME
content = re.sub(r'\s*ASSETCATALOG_COMPILER_APPICON_NAME\s*=\s*AppIcon;\n', '\n', content)
with open('$PBXPROJ', 'w') as f:
    f.write(content)
"

# Step 2: Build with xcodebuild (no asset catalog)
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme AautiLearn \
  -destination "id=$SIM_UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  -configuration Debug \
  COMPILER_INDEX_STORE_ENABLE=NO \
  build 2>&1 | grep -E "BUILD (SUCCEEDED|FAILED)|error:|warning:" | tail -20

# Restore project.pbxproj
cp "$PBXPROJ.bak" "$PBXPROJ"
rm "$PBXPROJ.bak"

# Check build succeeded
APP_BUNDLE="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/AautiLearn.app"
if [ ! -d "$APP_BUNDLE" ]; then
  echo "❌ Build failed. Check output above."
  exit 1
fi
echo "✅ Build succeeded"

# Step 3: Manually compile asset catalog (bypass CoreSimulator)
echo "🎨 Compiling asset catalog..."
mkdir -p /tmp/aauti-assets
/Applications/Xcode.app/Contents/Developer/usr/bin/actool \
  --output-format human-readable-text \
  --notices --warnings \
  --output-partial-info-plist /tmp/aauti-assets-info.plist \
  --app-icon AppIcon \
  --compress-pngs \
  --enable-on-demand-resources YES \
  --development-region en \
  --target-device iphone --target-device ipad \
  --minimum-deployment-target 15.1 \
  --platform macosx \
  --compile /tmp/aauti-assets \
  "$ASSETS_DIR" 2>&1 | grep -v "^$"

# Step 4: Copy compiled assets into app bundle
cp /tmp/aauti-assets/Assets.car "$APP_BUNDLE/Assets.car"
echo "✅ Assets injected"

# Step 5: Install and launch
echo "📲 Installing on simulator..."
xcrun simctl install "$SIM_UDID" "$APP_BUNDLE"
echo "🚀 Launching..."
xcrun simctl launch "$SIM_UDID" com.aautilearn.app
echo ""
echo "✅ AautiLearn is running on simulator!"
echo "   Make sure Metro bundler is running: npx expo start --port 8081"
