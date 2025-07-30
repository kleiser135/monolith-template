# Monolith Template

A modern, full-stack Next.js application template designed for rapid development and deployment. Built with TypeScript, Prisma, PostgreSQL, and comprehensive testing infrastructure.

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

- **Unit Tests**: 80%+ code coverage with Vitest and React Testing Library
- **E2E Tests**: Cypress with custom commands and database seeding
- **Visual Regression**: Percy.io integration for UI consistency
- **TDD Workflow**: Red-Green-Refactor development cycle

### Running Tests
```bash
npm test              # Unit tests
npm run test:coverage # Coverage report
npm run e2e           # Cypress E2E tests
npm run percy         # Visual regression tests
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

## 🚀 Deployment

The template is optimized for deployment on Vercel with:
- Edge Runtime compatibility
- Environment variable management
- PostgreSQL database support
- Automatic HTTPS and custom domains

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

---

Built with ❤️ for rapid full-stack development
