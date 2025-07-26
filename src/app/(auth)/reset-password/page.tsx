import { ResetPasswordForm } from "@/components/features/auth/reset-password/ResetPasswordForm";
import { AuthLayout } from "@/components/features/auth/shared/AuthLayout";

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your new password below."
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
} 