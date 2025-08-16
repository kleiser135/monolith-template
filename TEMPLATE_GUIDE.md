# Template Guide

## What's Included

### Authentication System
Complete user authentication flow with JWT-based sessions, including login, signup, password reset, and email verification. Features secure middleware protection and session persistence.

### User Management
Full user profile system with avatar upload, profile editing, password changes, and account deletion. Includes secure file upload with image processing and validation.

### Testing Setup
Comprehensive testing infrastructure with Vitest for unit/integration tests and Cypress for end-to-end testing. Includes 93%+ code coverage with automated reporting and CI/CD integration.

### UI Components
Production-ready component library built with Radix UI and Tailwind CSS. Includes buttons, forms, modals, alerts, and a complete design system with dark/light mode support.

### Database Setup with Prisma
PostgreSQL database integration with Prisma ORM, including migrations, seeding, and type-safe database queries. Docker setup included for local development.

### Middleware for Route Protection
Next.js middleware for protecting authenticated routes, CSRF protection, rate limiting, and comprehensive security headers.

## Architecture Overview

### Folder Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authentication pages (login, signup)
│   ├── (app)/          # Protected application pages
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/             # Reusable UI components
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components
├── lib/                # Utility functions and configurations
├── middleware/         # Next.js middleware
└── store/              # State management (Zustand)
```

### Component Organization
- **Features vs UI**: Business logic components in `features/`, reusable UI in `ui/`
- **Barrel Exports**: Clean imports with index.ts files
- **Type Safety**: Full TypeScript coverage with strict mode

### API Route Patterns
- **RESTful Design**: Consistent API structure with proper HTTP methods
- **Input Validation**: Zod schemas for request validation
- **Error Handling**: Standardized error responses and logging

### State Management Approach
- **Zustand**: Lightweight global state for user sessions and UI state
- **Server State**: React Server Components for data fetching
- **Form State**: React Hook Form with Zod validation

## Key Technologies

- **Next.js 15.x** - React framework with App Router
- **TypeScript** - Static type checking and enhanced developer experience
- **Prisma ORM** - Type-safe database client with migrations
- **PostgreSQL** - Production-ready relational database
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Fast unit testing framework
- **Cypress** - End-to-end testing framework
- **Radix UI** - Accessible component primitives
- **Zustand** - Lightweight state management
- **Zod** - Schema validation library
- **Sharp** - High-performance image processing
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token management
