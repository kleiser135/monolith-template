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
│   ├── (auth)/            # Authentication routes with shared layout
│   ├── (public)/          # Public marketing routes
│   └── api/               # API routes and server actions
├── components/
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components (headers, footer)
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities, actions, validation schemas
└── test/                  # Test utilities and setup
```

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
- **Coverage Achievement**: 81.54% comprehensive code coverage
- **Test Count**: 431 tests passing across all components and features
- **Performance**: Fast execution with Vite-powered testing
- **CI/CD Integration**: Automated testing in deployment pipeline

### Running Tests
```bash
npm test              # Unit tests (431 tests)
npm run test:coverage # Coverage report (81.54% coverage)
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
- ✅ **Testing Excellence**: 81.54% code coverage with 431 passing tests

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
