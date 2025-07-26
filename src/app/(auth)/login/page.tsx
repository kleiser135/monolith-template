import { LoginForm } from "@/components/features/auth/login/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground hover:text-primary"
        >
          Forgot password?
        </Link>
        <p className="text-muted-foreground mt-2">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 