"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button/button";

export function DashboardPage() {
  // No client-side authentication check needed - middleware handles all security
  // If user reaches this page, they are already authenticated by server-side middleware

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Dashboard (Protected)</h1>
      <p className="mt-4 mb-8">This page should only be visible to logged-in users.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
        <Link href="/dashboard/profile">
          <Button variant="outline" className="w-full">
            View Profile
          </Button>
        </Link>
        
        <Link href="/dashboard/toast-demo">
          <Button variant="outline" className="w-full">
            Toast Demo
          </Button>
        </Link>
        
        <Button variant="destructive" className="w-full md:col-span-2">
          Protected Action
        </Button>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          This is a protected dashboard area. You can only see this because you are logged in.
        </p>
      </div>
    </main>
  );
}
