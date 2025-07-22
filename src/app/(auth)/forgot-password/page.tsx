import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/features/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Your Password?"
      subtitle="No problem. Enter your email and we'll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
} 