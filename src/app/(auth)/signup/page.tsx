import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { SignupForm } from "@/components/features/auth/SignupForm";

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