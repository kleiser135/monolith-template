import { ReactNode } from "react";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Brand Logo */}
      <div className="mb-8">
        <Link 
          href="/" 
          className="flex items-center space-x-2 text-2xl font-bold text-foreground transition-colors hover:text-foreground/80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-lg font-bold">AT</span>
          </div>
          <span>App Template</span>
        </Link>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
} 