"use client";

import { usePathname } from "next/navigation";
import { AppHeader, AuthHeader } from "./headers";

interface ConditionalHeaderProps {
  isLoggedIn: boolean;
}

/**
 * ConditionalHeader determines which header to show based on the current route
 * Following modern web standards:
 * - Landing pages: No header (component has its own)
 * - Authentication pages: Minimal header with logo
 * - Application pages: Full header with navigation
 */
export function ConditionalHeader({ isLoggedIn }: ConditionalHeaderProps) {
  const pathname = usePathname();
  
  // Routes that have their own custom headers
  const customHeaderRoutes = ['/landing'];
  
  // Define routes that should use minimal auth header
  const authRoutes = [
    '/login',
    '/signup', 
    '/forgot-password',
    '/reset-password',
    '/email-verification'
  ];
  
  // Check if current route has a custom header
  const hasCustomHeader = customHeaderRoutes.some(route => pathname.startsWith(route));
  
  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (hasCustomHeader) {
    // Landing page and other custom header pages handle their own headers
    return null;
  }
  
  if (isAuthRoute) {
    // Minimal header for authentication pages
    return <AuthHeader />;
  }
  
  // Use full header for all other application pages
  return <AppHeader isLoggedIn={isLoggedIn} />;
}
