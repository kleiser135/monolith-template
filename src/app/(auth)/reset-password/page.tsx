import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";

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