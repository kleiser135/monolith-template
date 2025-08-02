"use client";

import { LoginForm } from "@/components/features/auth/login/LoginForm";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <>
      {/* Form - title is now handled by AnimatedAuthContainer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <LoginForm />
      </motion.div>

      {/* Footer Links */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mt-6 space-y-3"
      >
        <p className="text-sm text-slate-300">
          Don't have an account?{" "}
          <Link 
            href="/signup" 
            className="font-medium text-blue-400 hover:text-blue-300 transition-colors underline-offset-4 hover:underline relative group"
          >
            Sign up
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
          </Link>
        </p>
        <div className="pt-1 border-t border-slate-700/30">
          <Link 
            href="/forgot-password" 
            className="text-xs text-slate-300 hover:text-slate-200 transition-colors underline-offset-4 hover:underline relative group"
          >
            Forgot your password?
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-slate-300 transition-all duration-200 group-hover:w-full"></span>
          </Link>
        </div>
      </motion.div>
    </>
  );
}
