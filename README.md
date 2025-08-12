# Monolith Template

A production-ready, full-stack Next.js application template designed for rapid development and enterprise deployment. Built with TypeScript, Prisma, PostgreSQL, and comprehensive testing infrastructure achieving 81.21% code coverage.

## 🎯 Production Achievements

- ✅ **Testing Excellence**: 709 tests passing with 81.21% code coverage
- ✅ **Security Hardened**: Enterprise-grade authentication and security measures
- ✅ **Production Ready**: Complete deployment infrastructure and monitoring
- ✅ **Documentation Complete**: Comprehensive guides and operational procedures

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Setup
```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd monolith-template
npm install

# 2. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Start the database
docker-compose up -d

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed the database (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.4.4 with App Router, React 18, TypeScript
- **Backend**: Next.js API Routes with server actions
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4 with custom design system
- **Animation**: Framer Motion for advanced animations
- **Authentication**: JWT with HttpOnly cookies, bcrypt password hashing
- **Testing**: Vitest + React Testing Library, Cypress E2E, Percy visual regression
- **State Management**: Zustand for global state

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated application routes
│   │   └── dashboard/     # Dashboard and user features
│   ├── (auth)/            # Authentication routes with shared layout
│   │   ├── login/         # Login page
│   │   ├── signup/        # Registration page
│   │   ├── forgot-password/ # Password reset flow
│   │   └── ...            # Other auth pages
│   ├── (public)/          # Public marketing routes
│   │   └── page.tsx       # Landing page
│   ├── api/               # API routes and server actions
│   │   ├── auth/          # Authentication endpoints
│   │   ├── user/          # User management endpoints
│   │   ├── admin/         # Admin-only endpoints
│   │   ├── health/        # Health check endpoint
│   │   └── test/          # Testing utilities (dev only)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   ├── error.tsx          # Global error boundary
│   ├── loading.tsx        # Global loading UI
│   └── not-found.tsx      # 404 page
├── components/
│   ├── features/          # Feature-specific components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── profile/       # User profile components
│   │   └── ...            # Other feature directories
│   ├── layout/            # Layout components
│   │   ├── core/          # Headers, footers, main layout
│   │   ├── animations/    # Page transitions, backgrounds
│   │   ├── headers/       # Specialized header variants
│   │   └── AnimatedAuthContainer/ # Auth-specific containers
│   ├── theme/             # Theme providers and toggles
│   └── ui/                # Reusable UI components
├── lib/                   # Organized utility libraries
│   ├── auth/              # Authentication utilities
│   ├── validation/        # Input sanitization, validators
│   ├── api/               # API clients, server actions, rate limiting
│   ├── database/          # Prisma configuration
│   ├── security/          # CSRF, headers, logging, threat detection
│   ├── ui/                # UI helpers and utilities
│   └── utils.ts           # General utility functions
└── test/                  # Test utilities and setup
```

The directory structure follows modern React/Next.js best practices with logical grouping by functionality, making the codebase more maintainable and easier to navigate as it scales.

## 🔐 Authentication & Security

- **JWT Authentication**: Server-side middleware protection with HttpOnly cookies
- **Password Security**: bcrypt hashing with proper salt rounds
- **Route Protection**: Middleware-based authentication for all protected routes
- **Edge Runtime Compatible**: Optimized for Vercel Edge Runtime deployment

## 🧪 Testing Strategy

- **Unit Tests**: 81.21% code coverage with 709 passing tests (Vitest + React Testing Library)
- **E2E Tests**: Comprehensive Cypress testing with custom commands and database seeding
- **Visual Regression**: Percy.io integration for UI consistency
- **TDD Workflow**: Red-Green-Refactor development cycle with continuous validation

### Testing Infrastructure
- **Coverage Achievement**: 81.21% comprehensive code coverage
- **Test Count**: 709 tests passing across all components and features
- **Performance**: Fast execution with Vite-powered testing
- **CI/CD Integration**: Automated testing in deployment pipeline

### Running Tests
```bash
npm test              # Unit tests (709 tests)
npm run test:coverage # Coverage report (81.21% coverage)
npm run e2e           # Cypress E2E tests
npm run percy         # Visual regression tests
npm run test:watch    # Watch mode for development
```

## 🎨 UI Components & Design

### Header Architecture
Context-aware header system with specialized headers:
- **LandingHeader**: Custom branding for marketing pages
- **AppHeader**: Full navigation for authenticated users
- **AuthHeader**: Minimal design for authentication flows

### Header Architecture
Context-aware header system with specialized headers:
- **LandingHeader**: Custom branding for marketing pages
- **AppHeader**: Full navigation for authenticated users
- **AuthHeader**: Minimal design for authentication flows

### Component Library
- Consistent design system with Tailwind CSS
- Accessible components following ARIA standards
- Dark/light theme support with next-themes
- Framer Motion animations for enhanced UX

## 📝 Key Features

- ✅ **Complete Authentication System**: Login, signup, password reset, email verification
- ✅ **User Management**: Profile editing, password change, account deletion
- ✅ **Landing Page**: Modern marketing page with animations and responsive design
- ✅ **Dashboard**: Protected user dashboard with navigation
- ✅ **Form Validation**: Zod schemas with proper error handling
- ✅ **Toast Notifications**: User feedback with sonner
- ✅ **Route Groups**: Organized routing with Next.js 13+ route groups
- ✅ **Security Implementation**: Enterprise-grade security measures and logging
- ✅ **Production Infrastructure**: Complete monitoring and deployment readiness
- ✅ **Testing Excellence**: 81.21% code coverage with 709 passing tests

## 🚀 Production Deployment

The template is production-ready with enterprise-grade infrastructure:
- **Security**: Complete authentication, authorization, and security logging
- **Monitoring**: Health checks, error tracking, and performance monitoring
- **Deployment**: Vercel optimized with Edge Runtime compatibility
- **Database**: PostgreSQL with connection pooling and migration management
- **Documentation**: Complete operational procedures and troubleshooting guides

### Infrastructure Features
- Environment variable management and validation
- Automatic HTTPS and custom domain support
- Database connection pooling and query optimization
- Comprehensive error handling and logging
- Security headers and CSRF protection

## 📚 Development

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:studio    # Prisma Studio
npm run db:reset     # Reset database
```

### Contributing
1. Create feature branches for all changes
2. Follow conventional commit messages
3. Ensure tests pass before committing
4. Use the provided checklist for feature completion

## 📚 Documentation

Comprehensive documentation is available in the `/documentation/` folder:

- **[Testing Documentation](../documentation/TESTING_DOCUMENTATION.md)**: Complete testing infrastructure guide
- **[Production Readiness](../documentation/PRODUCTION_READINESS.md)**: Deployment and operational procedures
- **[App Checklist](../documentation/project-management/app-checklist.md)**: Development progress tracking
- **[Troubleshooting](../documentation/troubleshooting/known-issues.md)**: Common issues and solutions

---

Built with ❤️ for rapid full-stack development
