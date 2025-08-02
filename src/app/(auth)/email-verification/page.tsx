"use client";

import { AuthLayout } from "@/components/features/auth/shared/AuthLayout";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button/button";
import { CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react";
import apiClient from "@/lib/api-client";

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

  if (status === "verifying") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Verifying Email</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Email Verified!</h3>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
            <p className="text-sm text-muted-foreground">
              You can now sign in to your account.
            </p>
          </div>
        </div>
        
        <Button asChild className="w-full">
          <Link href="/login">
            Continue to Login
          </Link>
        </Button>
      </div>
    );
  }

  // Error state
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Verification Failed</h3>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">
          <p>The verification link may have expired or is invalid.</p>
          <p>Please try signing up again or contact support if the problem persists.</p>
        </div>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/signup">
              <Mail className="h-4 w-4 mr-2" />
              Sign Up Again
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-transparent" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading</h3>
          <p className="text-sm text-muted-foreground">
            Preparing verification...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="We're confirming your email address to secure your account."
    >
      <Suspense fallback={<LoadingSpinner />}>
        <VerificationComponent />
      </Suspense>
    </AuthLayout>
  );
} 