import { LoginForm } from "@/components/features/auth/login/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm">
          Sign in to continue to your account
        </p>
      </div>

      {/* Form */}
      <LoginForm />

      {/* Footer Links */}
      <div className="text-center mt-6 space-y-3">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link 
            href="/signup" 
            className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
        <p className="text-xs text-muted-foreground">
          <Link 
            href="/forgot-password" 
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </>
  );
}
