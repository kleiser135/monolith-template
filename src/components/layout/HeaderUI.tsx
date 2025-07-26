"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/features/auth/logout-button/LogoutButton";

interface HeaderUIProps {
  isLoggedIn: boolean;
}

export function HeaderUI({ isLoggedIn }: HeaderUIProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              App Template
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                <Button asChild variant="ghost">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" size="icon">
                  <Link href="/dashboard/profile">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Profile</span>
                  </Link>
                </Button>
                <LogoutButton />
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
} 