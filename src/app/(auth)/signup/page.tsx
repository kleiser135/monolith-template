import { SignupForm } from "@/components/features/auth/signup/SignupForm";
import { AuthLayout } from "@/components/features/auth/shared/AuthLayout";

export default function SignupPage() {
  return (
    <AuthLayout title="Create an Account">
      <p className="text-muted-foreground text-center mb-6">
        Enter your details below to create your account
      </p>
      <SignupForm />
    </AuthLayout>
  );
} 