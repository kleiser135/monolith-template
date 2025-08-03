"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import Image from "next/image";

interface AnimatedAuthContainerProps {
  children: ReactNode;
  formKey: string; // Unique key for each form type (signin, signup, forgot-password, etc.)
  showLogo?: boolean; // Option to show/hide logo
  title?: string; // Customizable title
  subtitle?: string; // Optional subtitle for additional context
}

export function AnimatedAuthContainer({ 
  children, 
  formKey, 
  showLogo = true,
  title = "Welcome",
  subtitle
}: AnimatedAuthContainerProps) {
  return (
    <motion.div
      layoutId="auth-container" // Isolate this container's animations
      layout
      className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl shadow-2xl flex-shrink-0 overflow-hidden"
      transition={{ 
        layout: { 
          duration: 0.4, 
          ease: [0.25, 0.4, 0.25, 1] // Custom easing for smooth transitions
        }
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={formKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="p-8"
        >
          {/* Logo and title inside the container */}
          {showLogo && (
            <div className="text-center mb-8">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="relative mb-4"
              >
                <Image
                  src="/template-logo.svg"
                  alt="App Logo"
                  width={64}
                  height={64}
                  className="mx-auto object-contain w-16 h-16"
                />
              </motion.div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{title}</h1>
              {subtitle && (
                <p className="text-slate-400 text-base leading-relaxed">{subtitle}</p>
              )}
            </div>
          )}
          
          {/* Form content */}
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
