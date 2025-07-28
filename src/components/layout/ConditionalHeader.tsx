"use client";

import { usePathname } from "next/navigation";
import { HeaderUI } from "./HeaderUI";

interface ConditionalHeaderProps {
  isLoggedIn: boolean;
}

/**
 * ConditionalHeader determines which header to show based on the current route
 * Following modern web standards:
 * - Authentication pages: Minimal header (just logo)
 * - Application pages: Full header with navigation
 * - Public pages: Marketing header with CTAs
 */
export function ConditionalHeader({ isLoggedIn }: ConditionalHeaderProps) {
  const pathname = usePathname();
  
  // Define routes that should use minimal auth header
  const authRoutes = [
    '/login',
    '/signup', 
    '/forgot-password',
    '/reset-password',
    '/email-verification'
  ];
  
  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (isAuthRoute) {
    // No header for authentication pages - modern, clean approach
    // Users should focus entirely on the authentication task
    return null;
  }
  
  // Use full header for all other pages
  return <HeaderUI isLoggedIn={isLoggedIn} />;
}
