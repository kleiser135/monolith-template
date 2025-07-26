import Link from "next/link";
import { Button } from "@/components/ui/button/button";

export default function DashboardPage() {
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
      </div>
      
      <p className="mt-6 text-sm text-gray-600">
        Explore different features and components available in the app.
      </p>
    </main>
  );
} 