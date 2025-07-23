import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const isAuthenticated = !!token;

  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/email-verification'];
  const protectedRoutes = ['/dashboard', '/'];

  const { pathname } = request.nextUrl;

  // Special case: If user is authenticated and at the root, redirect to dashboard
  if (isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and is trying to access a protected route,
  // redirect them to the login page.
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and is trying to access a public-only route (e.g., login page),
  // redirect them to the dashboard.
  if (isAuthenticated && publicRoutes.some(route => pathname.startsWith(route) && route !== '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 