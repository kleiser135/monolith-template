import { LoginForm } from "@/components/features/auth/login/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Welcome back
        </h1>
        <p className="text-slate-400 text-sm">
          Sign in to continue organizing epic game nights
        </p>
      </div>

      {/* Form */}
      <LoginForm />

      {/* Footer Links */}
      <div className="text-center mt-6 space-y-3">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <Link 
            href="/signup" 
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
        <p className="text-xs text-slate-500">
          <Link 
            href="/forgot-password" 
            className="hover:text-slate-400 transition-colors underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </>
  );
}
