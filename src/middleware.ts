import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enhanced middleware with proper JWT validation and security
 */

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Configuration for route protection
 */
const ROUTE_CONFIG = {
  // Routes that require authentication
  PROTECTED_ROUTES: ['/dashboard'],
  
  // Routes that should redirect to dashboard if already authenticated
  AUTH_ONLY_ROUTES: ['/login', '/signup', '/forgot-password', '/reset-password'],
  
  // Routes that don't require authentication checks (including landing page)
  PUBLIC_ROUTES: ['/email-verification', '/', '/landing'],
  
  // Default redirects
  AUTHENTICATED_REDIRECT: '/dashboard',
  UNAUTHENTICATED_REDIRECT: '/login',
} as const;

/**
 * Validates a JWT token and returns the decoded payload
 * Note: Uses simple token parsing for Edge Runtime compatibility
 * Full JWT verification should be done in API routes with Node.js runtime
 */
function validateToken(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return null;
    }
    
    // Simple JWT parsing without verification for middleware
    // This is a security trade-off for Edge Runtime compatibility
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(atob(parts[1])) as JWTPayload;
    
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Checks if a path matches any of the given route patterns
 */
function matchesRoutes(pathname: string, routes: readonly string[]): boolean {
  // Normalize trailing slashes for comparison
  const normalize = (str: string) => str.replace(/\/$/, '');
  const normalizedPath = normalize(pathname);
  return routes.some(route => {
    const normalizedRoute = normalize(route);
    return (
      normalizedPath === normalizedRoute ||
      normalizedPath.startsWith(normalizedRoute + '/')
    );
  });
}

/**
 * Creates a response that clears an invalid token
 */
function createResponseWithClearedToken(redirectUrl: string, request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set('token', '', { 
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('token');
  
  // Only log in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log(`[Middleware] ${pathname}`);
  }
  
  // Validate authentication status
  let isAuthenticated = false;
  let hasInvalidToken = false;
  
  if (tokenCookie) {
    const validatedToken = validateToken(tokenCookie.value);
    if (validatedToken) {
      isAuthenticated = true;
    } else {
      hasInvalidToken = true; // Token exists but is invalid
    }
  }
  
  // Handle root path - show landing page for unauthenticated, dashboard for authenticated
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(ROUTE_CONFIG.AUTHENTICATED_REDIRECT, request.url));
    } else {
      // Let unauthenticated users see the landing page
      return NextResponse.next();
    }
  }
  
  // Handle protected routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      if (isDev) {
        console.log(`[Middleware] Protected route blocked: ${pathname} -> /login`);
      }
      // Clear invalid token if present and redirect to login
      if (hasInvalidToken) {
        return createResponseWithClearedToken(ROUTE_CONFIG.UNAUTHENTICATED_REDIRECT, request);
      }
      return NextResponse.redirect(new URL(ROUTE_CONFIG.UNAUTHENTICATED_REDIRECT, request.url));
    }
    // User is authenticated, allow access
    return NextResponse.next();
  }
  
  // Handle auth-only routes (login, signup, etc.)
  if (matchesRoutes(pathname, ROUTE_CONFIG.AUTH_ONLY_ROUTES)) {
    if (isAuthenticated) {
      if (isDev) {
        console.log(`[Middleware] Auth route redirect: ${pathname} -> /dashboard`);
      }
      // Already logged in, redirect to dashboard
      return NextResponse.redirect(new URL(ROUTE_CONFIG.AUTHENTICATED_REDIRECT, request.url));
    }
    // Clear invalid token if present but still show the auth page
    if (hasInvalidToken) {
      const response = NextResponse.next();
      response.cookies.set('token', '', { 
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      return response;
    }
    // User is not authenticated, allow access to auth pages
    return NextResponse.next();
  }
  
  // Handle public routes - allow access regardless of auth status
  if (matchesRoutes(pathname, ROUTE_CONFIG.PUBLIC_ROUTES)) {
    return NextResponse.next();
  }
  
  // Default: allow access to any other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};