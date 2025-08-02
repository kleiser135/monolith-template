"use client";

import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface LandingHeaderProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  headerBg: string;
  scrollY: number;
}

export function LandingHeader({ isMenuOpen, toggleMenu, headerBg, scrollY }: LandingHeaderProps) {
  const isTransparent = headerBg === 'bg-transparent';
  
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`sticky top-0 z-50 w-full ${headerBg} ${
        isTransparent ? '' : 'backdrop-blur-lg'
      } transition-all duration-300 ${
        scrollY > 50 && !isTransparent ? "shadow-xl shadow-slate-900/50" : ""
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center px-6 relative">
        <nav className="hidden md:flex gap-6 lg:gap-8 flex-1">
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
          >
            Features
          </a>
          <a
            href="#events"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
          >
            Events
          </a>
          <a
            href="#community"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
          >
            Community
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-blue-400"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="h-10 w-10 flex items-center justify-center shadow-lg"
          >
            <Image
              src="/wizard-logo.png"
              alt="App Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </motion.div>
          <span className="font-bold text-xl text-white whitespace-nowrap">APP TEMPLATE</span>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="hidden md:flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800"
                asChild
              >
                <Link href="/login">Log In</Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                asChild
              >
                <Link href="/signup">Start Organizing</Link>
              </Button>
            </motion.div>
          </div>
          <button className="flex md:hidden text-white" onClick={toggleMenu}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>
    </motion.header>
  );
}