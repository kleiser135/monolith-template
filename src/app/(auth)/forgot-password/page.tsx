import { ForgotPasswordForm } from "@/components/features/auth/forgot-password/ForgotPasswordForm";
import { AuthLayout } from "@/components/features/auth/shared/AuthLayout";

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