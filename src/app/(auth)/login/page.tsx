import { LoginForm } from "@/components/features/auth/login/LoginForm";
import Link from "next/link";

export default function LoginPage() {
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

      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">
          Enter your credentials to access your account
        </p>
      </div>

      {/* Login Form */}
      <LoginForm />

      {/* Additional Links */}
      <div className="mt-6 text-center text-sm space-y-2">
        <Link
          href="/forgot-password"
          className="block text-muted-foreground hover:text-primary transition-colors"
        >
          Forgot password?
        </Link>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 