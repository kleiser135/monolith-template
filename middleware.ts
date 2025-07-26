import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

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
  
  // Routes that don't require authentication checks
  PUBLIC_ROUTES: ['/email-verification'],
  
  // Default redirects
  AUTHENTICATED_REDIRECT: '/dashboard',
  UNAUTHENTICATED_REDIRECT: '/login',
} as const;

/**
 * Validates a JWT token and returns the decoded payload
 */
function validateToken(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Checks if a path matches any of the given route patterns
 */
function matchesRoutes(pathname: string, routes: readonly string[]): boolean {
  return routes.some(route => pathname.startsWith(route));
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
  console.log("✅ MIDDLEWARE RUNNING for", request.nextUrl.pathname);
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('token');
  
  // DEBUG: Log middleware execution
  console.log(`🛡️ MIDDLEWARE: ${pathname}, token: ${tokenCookie ? 'exists' : 'none'}`);
  
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
  
  // Handle root path - redirect based on auth status
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(ROUTE_CONFIG.AUTHENTICATED_REDIRECT, request.url));
    } else {
      return NextResponse.redirect(new URL(ROUTE_CONFIG.UNAUTHENTICATED_REDIRECT, request.url));
    }
  }
  
  // Handle protected routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.PROTECTED_ROUTES)) {
    console.log(`🔒 PROTECTED ROUTE detected: ${pathname}, isAuthenticated: ${isAuthenticated}`);
    if (!isAuthenticated) {
      console.log(`❌ REDIRECTING to login: ${pathname} -> ${ROUTE_CONFIG.UNAUTHENTICATED_REDIRECT}`);
      // Clear invalid token if present and redirect to login
      if (hasInvalidToken) {
        return createResponseWithClearedToken(ROUTE_CONFIG.UNAUTHENTICATED_REDIRECT, request);
      }
      return NextResponse.redirect(new URL(ROUTE_CONFIG.UNAUTHENTICATED_REDIRECT, request.url));
    }
    // User is authenticated, allow access
    console.log(`✅ ALLOWING access to protected route: ${pathname}`);
    return NextResponse.next();
  }
  
  // Handle auth-only routes (login, signup, etc.)
  if (matchesRoutes(pathname, ROUTE_CONFIG.AUTH_ONLY_ROUTES)) {
    if (isAuthenticated) {
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}; 