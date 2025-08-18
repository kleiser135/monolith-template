#!/bin/bash

# Phase 3: UI Components & Pages Migration
echo "🎨 Phase 3: Migrating UI Components & Pages"
echo "============================================"

CARDBOARD_PATH="/c/Users/kleis/Documents/Cursor-Projects/Cardboard/CardBoard"
TEMPLATE_PATH="/c/Users/kleis/Documents/Cursor-Projects/Pipelines/App-Template/monolith-template"

cd "$CARDBOARD_PATH"

echo "🧩 Step 1: New UI components..."

# Copy new UI components (that don't exist in CardBoard)
if [ -d "$TEMPLATE_PATH/src/components/ui" ]; then
    echo "   - Analyzing UI components..."
    
    # Copy specific new components
    for component in "avatar" "badge" "card" "select" "switch" "tabs" "toast"; do
        if [ -d "$TEMPLATE_PATH/src/components/ui/$component" ] && [ ! -d "$CARDBOARD_PATH/src/components/ui/$component" ]; then
            cp -r "$TEMPLATE_PATH/src/components/ui/$component" "$CARDBOARD_PATH/src/components/ui/"
            echo "     ✅ $component component"
        fi
    done
fi

echo ""
echo "👤 Step 2: Profile & user management features..."

# Copy profile features
if [ -d "$TEMPLATE_PATH/src/components/features/profile" ]; then
    mkdir -p "$CARDBOARD_PATH/src/components/features/profile"
    cp -r "$TEMPLATE_PATH/src/components/features/profile/" "$CARDBOARD_PATH/src/components/features/profile-enhanced/" 2>/dev/null
    echo "     ✅ Enhanced profile components (saved in profile-enhanced/ for review)"
fi

# Copy dashboard enhancements
if [ -d "$TEMPLATE_PATH/src/components/features/dashboard" ]; then
    cp -r "$TEMPLATE_PATH/src/components/features/dashboard/" "$CARDBOARD_PATH/src/components/features/dashboard-enhanced/" 2>/dev/null
    echo "     ✅ Enhanced dashboard components (saved in dashboard-enhanced/ for review)"
fi

echo ""
echo "📄 Step 3: Page enhancements..."

# Copy enhanced app pages (non-auth)
if [ -d "$TEMPLATE_PATH/src/app/(app)" ]; then
    echo "   - Copying enhanced app pages..."
    mkdir -p "$CARDBOARD_PATH/src/app/(app)-enhanced"
    cp -r "$TEMPLATE_PATH/src/app/(app)/" "$CARDBOARD_PATH/src/app/(app)-enhanced/" 2>/dev/null
    echo "     ✅ Enhanced app pages (saved in (app)-enhanced/ for review)"
fi

echo ""
echo "🎛️  Step 4: Layout enhancements..."

# Copy enhanced headers (but preserve CardBoard's branding)
if [ -d "$TEMPLATE_PATH/src/components/layout/headers" ]; then
    mkdir -p "$CARDBOARD_PATH/src/components/layout/headers-enhanced"
    cp -r "$TEMPLATE_PATH/src/components/layout/headers/" "$CARDBOARD_PATH/src/components/layout/headers-enhanced/" 2>/dev/null
    echo "     ✅ Enhanced headers (saved in headers-enhanced/ for review)"
fi

# Copy other layout improvements
for layout_component in "ConditionalHeader.tsx" "PageTransition.tsx"; do
    if [ -f "$TEMPLATE_PATH/src/components/layout/$layout_component" ]; then
        cp "$TEMPLATE_PATH/src/components/layout/$layout_component" "$CARDBOARD_PATH/src/components/layout/$layout_component-enhanced" 2>/dev/null
        echo "     ✅ Enhanced $layout_component (saved as $layout_component-enhanced for review)"
    fi
done

echo ""
echo "🎨 Step 5: Styling enhancements..."

# Copy enhanced global styles
cp "$TEMPLATE_PATH/src/app/globals.css" "$CARDBOARD_PATH/src/app/globals-enhanced.css" 2>/dev/null && echo "     ✅ Enhanced global styles (saved as globals-enhanced.css for review)"

# Copy enhanced Tailwind config
cp "$TEMPLATE_PATH/tailwind.config.ts" "$CARDBOARD_PATH/tailwind-enhanced.config.ts" 2>/dev/null && echo "     ✅ Enhanced Tailwind config (saved as tailwind-enhanced.config.ts for review)"

echo ""
echo "✅ Phase 3 Complete!"
echo ""
echo "🎯 MANUAL STEPS REQUIRED:"
echo "1. Review all *-enhanced files and merge the improvements you want"
echo "2. Update imports in your components to use new UI components"
echo "3. Test that your CardBoard branding still shows correctly"
echo "4. Merge styling improvements while keeping CardBoard's visual identity"
echo "5. Update your pages to use enhanced features (avatar upload, etc.)"
echo ""
echo "Ready for Phase 4? (Testing & Documentation)"
