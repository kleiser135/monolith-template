"use client";

import { AuthLayout } from "@/components/features/auth/AuthLayout";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function VerificationComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiClient.post<{ message: string }>(
          "/auth/email-verification",
          { token }
        );
        setStatus("success");
        setMessage(response.message);
      } catch (error) {
        setStatus("error");
        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("An unknown error occurred.");
        }
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="text-center">
      <p className="mb-4">{message}</p>
      {status === "success" && (
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      )}
      {status === "error" && (
        <p className="text-muted-foreground">
          Please try signing up again or contact support.
        </p>
      )}
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Please wait while we verify your email address."
    >
      <Suspense fallback={<p>Loading...</p>}>
        <VerificationComponent />
      </Suspense>
    </AuthLayout>
  );
} 