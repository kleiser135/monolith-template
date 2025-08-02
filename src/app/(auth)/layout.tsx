"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SharedBackground } from "@/components/layout/SharedBackground";
import { AnimatedAuthContainer } from "@/components/layout/AnimatedAuthContainer";
import { usePathname } from "next/navigation";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  
  // Extract the page type from the pathname for the animation key
  const getFormKey = (path: string) => {
    if (path.includes('/login')) return 'login';
    if (path.includes('/signup')) return 'signup';
    if (path.includes('/forgot-password')) return 'forgot-password';
    if (path.includes('/reset-password')) return 'reset-password';
    if (path.includes('/email-verification')) return 'email-verification';
    return 'auth'; // fallback
  };

  // Get page-specific titles for better UX
  const getPageTitle = (path: string) => {
    if (path.includes('/login')) return 'Welcome back';
    if (path.includes('/signup')) return 'Create account';
    if (path.includes('/forgot-password')) return 'Reset password';
    if (path.includes('/reset-password')) return 'New password';
    if (path.includes('/email-verification')) return 'Verify email';
    return 'Welcome';
  };

  // Get page-specific subtitles for better UX
  const getPageSubtitle = (path: string) => {
    if (path.includes('/login')) return 'Sign in to continue organizing epic game nights';
    if (path.includes('/signup')) return 'Enter your details below to create your account';
    if (path.includes('/forgot-password')) return 'Enter your email to receive a password reset link';
    if (path.includes('/reset-password')) return 'Enter your new password below';
    if (path.includes('/email-verification')) return 'Check your email and click the verification link';
    return undefined;
  };

  const formKey = getFormKey(pathname);
  const pageTitle = getPageTitle(pathname);
  const pageSubtitle = getPageSubtitle(pathname);
  return (
    <SharedBackground variant="auth">
      <div className="flex items-center justify-center min-h-screen p-6">
        {/* Simplified container - logo is now inside AnimatedAuthContainer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="w-full max-w-md"
        >
          <AnimatedAuthContainer 
            formKey={formKey} 
            showLogo={true}
            title={pageTitle}
            subtitle={pageSubtitle}
          >
            {children}
          </AnimatedAuthContainer>
        </motion.div>
      </div>
    </SharedBackground>
  );
}
