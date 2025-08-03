"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./headers";

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
  
  // Routes that have their own custom headers or no header at all
  const noHeaderRoutes = ['/', '/landing', '/login', '/signup', '/forgot-password', '/reset-password', '/email-verification'];
  
  // Check if current route should have no header
  const hasNoHeader = noHeaderRoutes.some(route => pathname.startsWith(route));
  
  if (hasNoHeader) {
    // Landing page and auth pages handle their own headers or have none
    return null;
  }
  
  // Use full header for all other application pages
  return <AppHeader isLoggedIn={isLoggedIn} />;
}
