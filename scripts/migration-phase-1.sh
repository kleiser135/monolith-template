#!/bin/bash

# Phase 1: Dependencies & Infrastructure Migration
echo "🔧 Phase 1: Migrating Dependencies & Infrastructure"
echo "=================================================="

CARDBOARD_PATH="/c/Users/kleis/Documents/Cursor-Projects/Cardboard/CardBoard"
TEMPLATE_PATH="/c/Users/kleis/Documents/Cursor-Projects/Pipelines/App-Template/monolith-template"

cd "$CARDBOARD_PATH"

echo "📦 Step 1: Updating dependencies..."

# Create a temporary package.json with merged dependencies
echo "   - Analyzing template dependencies..."

# You'll need to manually merge these dependencies from template to CardBoard:
echo ""
echo "🔍 NEW DEPENDENCIES TO ADD TO CARDBOARD:"
echo "Add these to your CardBoard package.json:"
echo ""
echo "Dependencies to add:"
echo '  "csrf": "^3.1.0",'
echo '  "dompurify": "^3.2.6",'
echo '  "file-type": "^21.0.0",'
echo '  "ip-range-check": "^0.2.0",'
echo '  "isomorphic-dompurify": "^2.26.0",'
echo '  "sharp": "^0.34.3",'
echo '  "validator": "^13.15.15",'
echo ""
echo "DevDependencies to add:"
echo '  "@types/jsdom": "^21.1.7",'
echo '  "@types/validator": "^13.15.2",'
echo '  "jsdom": "^26.1.0",'
echo ""

echo "📋 Step 2: Infrastructure files to copy..."

# Copy security infrastructure
echo "   - Copying security modules..."
mkdir -p "$CARDBOARD_PATH/src/lib/security"
cp "$TEMPLATE_PATH/src/lib/csrf.ts" "$CARDBOARD_PATH/src/lib/" 2>/dev/null && echo "     ✅ CSRF protection"
cp "$TEMPLATE_PATH/src/lib/account-lockout.ts" "$CARDBOARD_PATH/src/lib/" 2>/dev/null && echo "     ✅ Account lockout"
cp "$TEMPLATE_PATH/src/lib/global-rate-limiting.ts" "$CARDBOARD_PATH/src/lib/" 2>/dev/null && echo "     ✅ Rate limiting"
cp "$TEMPLATE_PATH/src/lib/input-sanitization.ts" "$CARDBOARD_PATH/src/lib/" 2>/dev/null && echo "     ✅ Input sanitization"

# Copy security modules
cp -r "$TEMPLATE_PATH/src/lib/security/" "$CARDBOARD_PATH/src/lib/security/" 2>/dev/null && echo "     ✅ Security modules"

# Copy enhanced middleware
echo "   - Updating middleware..."
cp "$TEMPLATE_PATH/src/middleware.ts" "$CARDBOARD_PATH/src/middleware-new.ts" 2>/dev/null && echo "     ✅ Enhanced middleware (saved as middleware-new.ts for review)"

# Copy auth improvements
echo "   - Copying auth improvements..."
mkdir -p "$CARDBOARD_PATH/src/lib/auth"
cp -r "$TEMPLATE_PATH/src/lib/auth/" "$CARDBOARD_PATH/src/lib/auth/" 2>/dev/null && echo "     ✅ Auth utilities"

# Copy validation improvements
echo "   - Updating validation..."
cp "$TEMPLATE_PATH/src/lib/validators.ts" "$CARDBOARD_PATH/src/lib/validators-new.ts" 2>/dev/null && echo "     ✅ Enhanced validators (saved as validators-new.ts for review)"

echo ""
echo "✅ Phase 1 Complete!"
echo ""
echo "🎯 MANUAL STEPS REQUIRED:"
echo "1. Add the new dependencies to CardBoard's package.json"
echo "2. Run 'npm install' in CardBoard directory"
echo "3. Review middleware-new.ts and merge with your current middleware.ts"
echo "4. Review validators-new.ts and merge with your current validators.ts"
echo "5. Test that your app still builds and runs"
echo ""
echo "Ready for Phase 2? (API Routes & Database)"
