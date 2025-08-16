# Customization Guide

This guide walks you through customizing the template for your specific application needs.

## Initial Setup (Required)

### 1. Clone and Configure Repository
```bash
# Use this template on GitHub or clone directly
git clone <your-template-repo> my-new-app
cd my-new-app

# Install dependencies
npm install
```

### 2. Update Project Metadata
Edit `package.json`:
```json
{
  "name": "my-app-name",
  "version": "1.0.0",
  "description": "My application description",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-repo.git"
  }
}
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
DATABASE_URL="postgresql://user:password@localhost:5432/your_db"
JWT_SECRET="your-super-secret-jwt-key-64-characters-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Your App Name"
```

### 4. Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Run migrations
npx prisma migrate dev --name init

# Optional: Seed with sample data
npm run db:seed
```

### 5. Update App Metadata
Edit `src/app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description for SEO",
  keywords: "your, relevant, keywords",
};
```

## Branding Updates

### 1. Color Scheme
Edit `tailwind.config.ts` to update your color palette:
```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Update primary colors
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // Update secondary colors
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          900: '#0f172a',
        }
      }
    }
  }
}
```

### 2. Typography and Fonts
Edit `src/app/globals.css` to update fonts:
```css
/* Import your custom fonts */
@import url('https://fonts.googleapis.com/css2?family=Your+Font:wght@400;500;600;700&display=swap');

/* Update CSS variables */
:root {
  --font-sans: 'Your Font', system-ui, sans-serif;
}
```

### 3. Logo and Branding Assets
Replace these files in the `public/` directory:
- `template-logo.svg` - Main application logo
- `template-brand-logo.svg` - Brand logo variant
- `favicon.ico` - Browser favicon
- `feature-icons/` - Update feature icons as needed

### 4. Update Landing Page
Edit `src/components/features/landing/TemplateLanding.tsx`:
```typescript
// Update hero section
const heroContent = {
  title: "Your App Title",
  subtitle: "Your compelling value proposition",
  description: "Detailed description of what your app does"
};

// Update feature cards
const features = [
  {
    title: "Your Feature 1",
    description: "Description of your main feature",
    icon: YourIcon1
  },
  // ... more features
];
```

## Feature Configuration

### 1. Remove Unwanted Features
If you don't need certain features, you can remove them:

**Remove User Avatar Upload:**
```bash
# Remove avatar upload components
rm -rf src/components/features/profile/AvatarUpload.tsx
rm -rf src/app/api/user/avatar/

# Update profile page to remove avatar functionality
# Edit src/app/(app)/profile/page.tsx
```

**Remove Password Reset:**
```bash
# Remove password reset pages and API
rm -rf src/app/(auth)/forgot-password/
rm -rf src/app/(auth)/reset-password/
rm -rf src/app/api/auth/forgot-password/
rm -rf src/app/api/auth/reset-password/
```

### 2. Add New Features
Create new features following the established patterns:

```bash
# Create new feature structure
mkdir -p src/components/features/your-feature
mkdir -p src/app/(app)/your-feature
mkdir -p src/app/api/your-feature

# Add Prisma models
# Edit prisma/schema.prisma and run:
npx prisma migrate dev --name add_your_feature
```

### 3. Customize Navigation
Edit `src/components/layout/headers/AppHeader.tsx`:
```typescript
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Your Feature', href: '/your-feature' },
  { name: 'Profile', href: '/profile' },
];
```

### 4. Environment-Specific Configuration
Create feature flags in `src/lib/config/features.ts`:
```typescript
export const features = {
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableEmailVerification: process.env.EMAIL_ENABLED === 'true',
  enableFileUploads: true,
  maxFileUploadSize: 5 * 1024 * 1024, // 5MB
};
```

## Advanced Customization

### 1. Database Schema Changes
When adding new models to `prisma/schema.prisma`:
```bash
# Generate migration
npx prisma migrate dev --name add_your_model

# Update Prisma client
npx prisma generate

# Update seed file if needed
# Edit prisma/seed.ts
```

### 2. Authentication Customization
Extend the User model for additional fields:
```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  // Add your custom fields
  company  String?
  role     UserRole @default(USER)
  settings Json?
}

enum UserRole {
  USER
  ADMIN
  MANAGER
}
```

### 3. API Route Patterns
Follow established patterns when creating new API routes:
```typescript
// src/app/api/your-feature/route.ts
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await auth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your logic here
    
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### 4. Component Patterns
Follow the established component structure:
```typescript
// src/components/features/your-feature/YourComponent.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface YourComponentProps {
  data: YourDataType;
  onAction: (id: string) => void;
}

export function YourComponent({ data, onAction }: YourComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Feature</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your component content */}
      </CardContent>
    </Card>
  );
}
```

## Testing Your Customizations

### 1. Run Tests
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Check test coverage
npm run coverage
```

### 2. Build Verification
```bash
# Verify production build
npm run build

# Start production server
npm start
```

### 3. Type Checking
```bash
# Run TypeScript checks
npx tsc --noEmit

# Run linting
npm run lint
```

## Deployment Preparation

### 1. Environment Variables
Set up production environment variables:
```bash
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### 2. Database Migration
```bash
# Run migrations in production
npx prisma migrate deploy
```

### 3. Build and Deploy
```bash
# Build for production
npm run build

# Deploy to your platform (Vercel, AWS, etc.)
```

## Getting Help

- Check the [Template Guide](./TEMPLATE_GUIDE.md) for feature overview
- Review existing code patterns in the `src/` directory
- Run tests to ensure your changes don't break existing functionality
- Check the `documentation/` folder for additional guides
