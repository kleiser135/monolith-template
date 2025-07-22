import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // NOTE: This is a placeholder. We will add logic here to check for an
  // authentication token (e.g., from a cookie) once we set up Supabase.
  const isAuthenticated = false; // Placeholder

  const publicRoutes = ['/login'];
  const protectedRoutes = ['/dashboard'];

  const { pathname } = request.nextUrl;

  // If user is not authenticated and is trying to access a protected route,
  // redirect them to the login page.
  if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and is trying to access a public-only route,
  // redirect them to the dashboard.
  if (isAuthenticated && publicRoutes.some(route => pathname.startsWith(route))) {
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