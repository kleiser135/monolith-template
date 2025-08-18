#!/bin/bash

# Phase 2: API Routes & Database Migration
echo "🗄️  Phase 2: Migrating API Routes & Database Features"
echo "===================================================="

CARDBOARD_PATH="/c/Users/kleis/Documents/Cursor-Projects/Cardboard/CardBoard"
TEMPLATE_PATH="/c/Users/kleis/Documents/Cursor-Projects/Pipelines/App-Template/monolith-template"

cd "$CARDBOARD_PATH"

echo "🔐 Step 1: Enhanced authentication API routes..."

# Copy enhanced auth routes
mkdir -p "$CARDBOARD_PATH/src/app/api/auth"

if [ -f "$TEMPLATE_PATH/src/app/api/auth/login/route.ts" ]; then
    cp "$TEMPLATE_PATH/src/app/api/auth/login/route.ts" "$CARDBOARD_PATH/src/app/api/auth/login/route-enhanced.ts"
    echo "     ✅ Enhanced login route (saved as route-enhanced.ts for review)"
fi

if [ -d "$TEMPLATE_PATH/src/app/api/user" ]; then
    echo "   - Copying user management APIs..."
    cp -r "$TEMPLATE_PATH/src/app/api/user/" "$CARDBOARD_PATH/src/app/api/user/" 2>/dev/null && echo "     ✅ User API routes (avatar, profile, etc.)"
fi

if [ -d "$TEMPLATE_PATH/src/app/api/admin" ]; then
    echo "   - Copying admin APIs..."
    cp -r "$TEMPLATE_PATH/src/app/api/admin/" "$CARDBOARD_PATH/src/app/api/admin/" 2>/dev/null && echo "     ✅ Admin API routes"
fi

if [ -f "$TEMPLATE_PATH/src/app/api/health/route.ts" ]; then
    mkdir -p "$CARDBOARD_PATH/src/app/api/health"
    cp "$TEMPLATE_PATH/src/app/api/health/route.ts" "$CARDBOARD_PATH/src/app/api/health/"
    echo "     ✅ Health check endpoint"
fi

echo ""
echo "🗃️  Step 2: Database schema updates..."

# Copy enhanced Prisma schema
cp "$TEMPLATE_PATH/prisma/schema.prisma" "$CARDBOARD_PATH/prisma/schema-enhanced.prisma" 2>/dev/null && echo "     ✅ Enhanced schema (saved as schema-enhanced.prisma for review)"

# Copy database utilities
if [ -d "$TEMPLATE_PATH/src/lib/db" ]; then
    cp -r "$TEMPLATE_PATH/src/lib/db/" "$CARDBOARD_PATH/src/lib/db/" 2>/dev/null && echo "     ✅ Database utilities"
fi

echo ""
echo "📁 Step 3: File upload system..."

# Check if avatar upload exists in template
if [ -d "$TEMPLATE_PATH/src/app/api/user/avatar" ]; then
    echo "   - Avatar upload system available in template"
    echo "     ✅ Avatar upload API already copied with user APIs"
fi

# Copy upload utilities
if [ -d "$TEMPLATE_PATH/src/lib/upload" ]; then
    cp -r "$TEMPLATE_PATH/src/lib/upload/" "$CARDBOARD_PATH/src/lib/upload/" 2>/dev/null && echo "     ✅ Upload utilities"
fi

echo ""
echo "✅ Phase 2 Complete!"
echo ""
echo "🎯 MANUAL STEPS REQUIRED:"
echo "1. Review schema-enhanced.prisma and merge changes into your schema.prisma"
echo "2. Create and run new migrations for schema changes:"
echo "   npx prisma migrate dev --name add_template_enhancements"
echo "3. Review route-enhanced.ts files and merge with existing routes"
echo "4. Test all API endpoints"
echo "5. Create uploads directory: mkdir -p public/uploads/avatars"
echo ""
echo "Ready for Phase 3? (UI Components & Pages)"
