"use client";

import { SignupForm } from "@/components/features/auth/signup/SignupForm";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SignupPage() {
  return (
    <>
      {/* Form - title is now handled by AnimatedAuthContainer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SignupForm />
      </motion.div>

      {/* Footer Links */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mt-6 space-y-3"
      >
        <p className="text-sm text-slate-300">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline relative group"
          >
            Sign in
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
          </Link>
        </p>
      </motion.div>
    </>
  );
} 