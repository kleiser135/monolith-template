#!/bin/bash

# CardBoard Migration Script
# This script helps migrate template improvements to CardBoard while preserving CardBoard-specific content

echo "🚀 CardBoard Template Migration Script"
echo "======================================"

CARDBOARD_PATH="/c/Users/kleis/Documents/Cursor-Projects/Cardboard/CardBoard"
TEMPLATE_PATH="/c/Users/kleis/Documents/Cursor-Projects/Pipelines/App-Template/monolith-template"

# Check if paths exist
if [ ! -d "$CARDBOARD_PATH" ]; then
    echo "❌ CardBoard path not found: $CARDBOARD_PATH"
    exit 1
fi

if [ ! -d "$TEMPLATE_PATH" ]; then
    echo "❌ Template path not found: $TEMPLATE_PATH"
    exit 1
fi

echo "📁 CardBoard: $CARDBOARD_PATH"
echo "📁 Template: $TEMPLATE_PATH"
echo ""

# Create backup directory
BACKUP_DIR="$CARDBOARD_PATH/cardboard-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup of CardBoard-specific files..."

# Backup CardBoard-specific files
echo "   - Landing page components"
cp -r "$CARDBOARD_PATH/src/components/features/landing" "$BACKUP_DIR/landing-components" 2>/dev/null || echo "   ⚠️  Landing components not found"

echo "   - Home page"
cp "$CARDBOARD_PATH/src/app/page.tsx" "$BACKUP_DIR/home-page.tsx" 2>/dev/null || echo "   ⚠️  Home page not found"

echo "   - CardBoard branding assets"
mkdir -p "$BACKUP_DIR/branding"
cp "$CARDBOARD_PATH/public/CardBoard_Wizard_NoText.png" "$BACKUP_DIR/branding/" 2>/dev/null || echo "   ⚠️  Wizard logo not found"
cp "$CARDBOARD_PATH/public/hero-background.png" "$BACKUP_DIR/branding/" 2>/dev/null || echo "   ⚠️  Hero background not found"
cp "$CARDBOARD_PATH/public/wizard-duel.png" "$BACKUP_DIR/branding/" 2>/dev/null || echo "   ⚠️  Wizard duel not found"
cp "$CARDBOARD_PATH/public/wizard-logo.png" "$BACKUP_DIR/branding/" 2>/dev/null || echo "   ⚠️  Wizard logo not found"

echo "   - Package.json for dependency comparison"
cp "$CARDBOARD_PATH/package.json" "$BACKUP_DIR/cardboard-package.json" 2>/dev/null || echo "   ⚠️  Package.json not found"

echo "   - Current README"
cp "$CARDBOARD_PATH/README.md" "$BACKUP_DIR/cardboard-readme.md" 2>/dev/null || echo "   ⚠️  README not found"

echo ""
echo "✅ Backup created at: $BACKUP_DIR"
echo ""

echo "🔍 Analyzing differences between CardBoard and Template..."
echo ""

# List what template has that CardBoard doesn't
echo "📋 New features in template that CardBoard can benefit from:"
echo ""

# Check for security features
if [ ! -f "$CARDBOARD_PATH/src/lib/csrf.ts" ]; then
    echo "   🔒 CSRF Protection"
fi

if [ ! -f "$CARDBOARD_PATH/src/lib/account-lockout.ts" ]; then
    echo "   🔒 Account Lockout System"
fi

if [ ! -f "$CARDBOARD_PATH/src/lib/global-rate-limiting.ts" ]; then
    echo "   🔒 Global Rate Limiting"
fi

if [ ! -f "$CARDBOARD_PATH/src/lib/input-sanitization.ts" ]; then
    echo "   🔒 Input Sanitization"
fi

# Check for file upload
if [ ! -d "$CARDBOARD_PATH/src/app/api/user/avatar" ]; then
    echo "   📁 Avatar Upload System"
fi

# Check for advanced testing
if [ ! -f "$CARDBOARD_PATH/vitest.config.ts" ] || ! grep -q "coverage" "$CARDBOARD_PATH/vitest.config.ts" 2>/dev/null; then
    echo "   🧪 Advanced Testing Setup with Coverage"
fi

# Check for security middleware
if ! grep -q "csrf" "$CARDBOARD_PATH/src/middleware.ts" 2>/dev/null; then
    echo "   🛡️  Enhanced Security Middleware"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Run the migration phases below"
echo "2. Test each phase thoroughly"
echo "3. Commit changes incrementally"
echo ""

echo "Would you like to proceed with Phase 1 (Dependencies & Infrastructure)? (y/n)"
