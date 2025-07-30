"use client";

import { Dice6 } from "lucide-react";
import Link from "next/link";

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex h-16 items-center justify-center">
        <Link href="/landing" className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Dice6 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">CARDBOARD</span>
        </Link>
      </div>
    </header>
  );
}
