"use client";

import { motion } from "framer-motion";
import { Menu, Dice6 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LandingHeaderProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  headerBg: string;
  scrollY: number;
}

export function LandingHeader({ isMenuOpen, toggleMenu, headerBg, scrollY }: LandingHeaderProps) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`sticky top-0 z-50 w-full ${headerBg} backdrop-blur-lg transition-all duration-300 ${
        scrollY > 50 ? "shadow-xl shadow-slate-900/50" : ""
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center px-6 relative">
        <nav className="hidden md:flex gap-6 lg:gap-8 flex-1">
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-orange-400"
          >
            Features
          </a>
          <a
            href="#events"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-orange-400"
          >
            Events
          </a>
          <a
            href="#community"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-orange-400"
          >
            Community
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-orange-400"
          >
            Contact
          </a>
        </nav>

        <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg"
          >
            <Dice6 className="h-5 w-5 text-white" />
          </motion.div>
          <span className="font-bold text-xl text-white whitespace-nowrap">CARDBOARD</span>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-600 text-slate-300 hover:bg-slate-800"
              asChild
            >
              <Link href="/login">Log In</Link>
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              asChild
            >
              <Link href="/signup">Start Organizing</Link>
            </Button>
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
