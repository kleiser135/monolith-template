import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      
      {/* Main Container */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 duration-700">
        {/* Logo Section with Enhanced Styling */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block group">
            <div className="relative">
              {/* Logo Background Circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-xl scale-150 group-hover:scale-175 transition-transform duration-500"></div>
              
              {/* Logo */}
              <div className="relative bg-card border border-border/50 rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-all duration-300 hover-lift">
                <img 
                  src="/wizard-logo.png" 
                  alt="Logo" 
                  className="h-12 w-auto mx-auto"
                  style={{
                    clipPath: 'inset(0 0 35% 0)'
                  }}
                />
              </div>
            </div>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-8 shadow-2xl">
          {/* Content */}
          {children}
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
            <span>Protected by advanced security</span>
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
