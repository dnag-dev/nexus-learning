#!/bin/bash
# ─── Aauti Learn — iOS App Store Build & Submit ───
#
# Prerequisites:
#   1. EAS CLI installed: npm install -g eas-cli
#   2. Logged into Expo: eas login
#   3. Apple Developer account connected: eas credentials
#   4. App created in App Store Connect
#
# Usage:
#   ./scripts/build-and-submit.sh          # Build + submit
#   ./scripts/build-and-submit.sh build    # Build only
#   ./scripts/build-and-submit.sh submit   # Submit latest build
#

set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-all}"
PROFILE="production"

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║     Aauti Learn — iOS Build & Submit  ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# ─── Step 1: Verify credentials ───
echo "→ Checking EAS login..."
eas whoami || { echo "❌ Not logged in. Run: eas login"; exit 1; }
echo ""

# ─── Step 2: TypeScript check ───
echo "→ Running TypeScript check..."
npx tsc --noEmit || { echo "❌ TypeScript errors found. Fix them first."; exit 1; }
echo "✅ TypeScript OK"
echo ""

# ─── Step 3: Build ───
if [[ "$MODE" == "all" || "$MODE" == "build" ]]; then
  echo "→ Starting iOS production build..."
  echo "  This will:"
  echo "    - Auto-increment build number"
  echo "    - Generate provisioning profile (if needed)"
  echo "    - Build on EAS servers (~15-20 min)"
  echo ""

  eas build --platform ios --profile "$PROFILE"

  echo ""
  echo "✅ Build complete!"
  echo ""
fi

# ─── Step 4: Submit to TestFlight ───
if [[ "$MODE" == "all" || "$MODE" == "submit" ]]; then
  echo "→ Submitting to App Store Connect (TestFlight)..."
  echo "  You'll need your ASC App ID if not already configured."
  echo ""

  eas submit --platform ios --profile "$PROFILE" --latest

  echo ""
  echo "✅ Submitted to TestFlight!"
  echo ""
  echo "  Next steps:"
  echo "    1. Open App Store Connect"
  echo "    2. Go to TestFlight → check build processing"
  echo "    3. Once processed, add to internal testers group"
  echo "    4. When ready, submit for App Store Review"
  echo ""
fi

echo "─── Done! ───"
