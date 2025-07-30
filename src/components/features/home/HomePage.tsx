import Link from "next/link";
import { Button } from "@/components/ui/button/button";

export function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
        Welcome to the Monolith Template
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        This is a starter template for building full-stack applications with
        Next.js, Prisma, and Tailwind CSS.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
      <div className="mt-4">
        <Button asChild variant="secondary">
          <Link href="/landing">View Cardboard Landing Page</Link>
        </Button>
      </div>
    </div>
  );
}
