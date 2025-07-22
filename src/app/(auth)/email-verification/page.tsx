"use client";

import { AuthLayout } from "@/components/features/auth/AuthLayout";

export default function EmailVerificationPage() {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="We've sent an email to your address. Please click the link to verify your account."
    >
      <div className="text-center">
        <p className="text-muted-foreground">
          Didn&apos;t receive an email?{" "}
          <button className="text-primary hover:underline">Resend</button>
        </p>
      </div>
    </AuthLayout>
  );
} 