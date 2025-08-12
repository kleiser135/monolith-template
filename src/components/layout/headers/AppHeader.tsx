"use client";

import { User, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button/button";
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LogoutButton } from "@/components/features/auth/logout-button/LogoutButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu/dropdown-menu";

interface AppHeaderProps {
  isLoggedIn: boolean;
}

export function AppHeader({ isLoggedIn }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo/Brand Section */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-xl font-bold text-foreground transition-colors hover:text-foreground/80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">AT</span>
            </div>
            <span className="hidden sm:inline-block">App Template</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex items-center space-x-2">
          {isLoggedIn ? (
            <>
              <Button 
                asChild 
                variant="ghost" 
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              
              {/* User Menu with Profile, Settings, and Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="flex items-center justify-between w-full cursor-pointer">
                      <div className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Theme
                      </div>
                      <ThemeToggle />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                asChild 
                variant="ghost" 
                size="sm"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button 
                asChild 
                size="sm"
              >
                <Link href="/signup">Sign Up</Link>
              </Button>
              
              {/* Theme toggle for non-authenticated users on public pages */}
              <div className="ml-2 flex items-center border-l border-border/40 pl-2">
                <ThemeToggle />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
} 