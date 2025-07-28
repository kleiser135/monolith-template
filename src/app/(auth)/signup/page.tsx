import { SignupForm } from "@/components/features/auth/signup/SignupForm";
import { AuthLayout } from "@/components/features/auth/shared/AuthLayout";
import Link from "next/link";

export default function SignupPage() {
  return (
    <AuthLayout 
      title="Create an Account"
      subtitle="Enter your details below to create your account"
    >
      <SignupForm />
      
      {/* Additional Links */}
      <div className="mt-6 text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
} 