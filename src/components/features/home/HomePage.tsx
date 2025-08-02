import Link from "next/link";
import { Button } from "@/components/ui/button/button";

export function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
        Welcome to Your App
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Organize epic game nights with the ultimate board game event platform.
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
          <Link href="/">Back to Landing Page</Link>
        </Button>
      </div>
    </div>
  );
}
