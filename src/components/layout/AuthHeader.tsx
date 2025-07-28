"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * AuthHeader - Minimal header for authentication pages
 * Following modern standards:
 * - Only shows logo/brand
 * - No navigation menu (users should complete auth flow)
 * - Optional theme toggle in discrete location
 * - Clean, focused design
 */
export function AuthHeader() {
  const pathname = usePathname();
  
  // Don't show "Back to home" on email verification as it's part of the flow
  const showHomeLink = !pathname.startsWith('/email-verification');
  
  return (
    <header className="w-full border-b border-border/40 bg-background">
      <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo/Brand Section */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-xl font-bold text-foreground transition-colors hover:text-foreground/80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">AT</span>
            </div>
            <span>App Template</span>
          </Link>
        </div>

        {/* Minimal Right Section */}
        <div className="flex items-center space-x-3">
          {showHomeLink && (
            <Link 
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Back to Home
            </Link>
          )}
          
          {/* Theme toggle in discrete location */}
          <div className="opacity-60 hover:opacity-100 transition-opacity">
            <ThemeToggle />
          </div>
        </div>
        
      </div>
    </header>
  );
}
