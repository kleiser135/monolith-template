import { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-950">
        <h1 className="text-center text-3xl font-bold">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-center mb-6">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
} 