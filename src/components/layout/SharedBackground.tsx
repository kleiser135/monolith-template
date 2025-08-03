"use client";

import { motion } from "framer-motion";

interface SharedBackgroundProps {
  children: React.ReactNode;
  variant?: 'landing' | 'auth';
}

export function SharedBackground({ children, variant = 'landing' }: SharedBackgroundProps) {
  // Deterministic positions for floating dots to avoid hydration mismatches
  const floatingDots = [
    { left: 15.2, top: 23.4, duration: 3.2, delay: 0.3 },
    { left: 67.8, top: 78.1, duration: 4.1, delay: 1.2 },
    { left: 89.5, top: 12.6, duration: 3.7, delay: 0.8 },
    { left: 34.7, top: 65.9, duration: 4.4, delay: 1.8 },
    { left: 78.3, top: 45.2, duration: 3.9, delay: 0.5 },
    { left: 12.1, top: 87.3, duration: 3.4, delay: 1.5 },
    { left: 56.9, top: 34.7, duration: 4.2, delay: 0.9 },
    { left: 91.2, top: 56.8, duration: 3.6, delay: 1.1 },
    { left: 23.5, top: 19.4, duration: 4.0, delay: 0.7 },
    { left: 45.8, top: 73.2, duration: 3.8, delay: 1.6 },
  ];

  // Different backgrounds for different variants
  const getBackgroundStyles = () => {
    if (variant === 'auth') {
      return {
        className: "min-h-screen bg-slate-900 relative overflow-hidden",
        style: {}
      };
    }
    
    // Default landing variant
    return {
      className: "min-h-screen bg-slate-900 relative overflow-hidden",
      style: {
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)",
        backgroundAttachment: "fixed"
      }
    };
  };

  const backgroundConfig = getBackgroundStyles();

  return (
    <div 
      className={backgroundConfig.className}
      style={variant === 'auth' ? { backgroundColor: '#0f172a' } : backgroundConfig.style}
    >
      {/* Background gradient layer - for auth variant */}
      {variant === 'auth' && (
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(45deg, #0f172a 0%, #1e293b 25%, #334155 75%, #475569 100%)",
            opacity: 0.9
          }}
        />
      )}
      
      {/* Landing background - applied directly to container */}
      {variant === 'landing' && (
        <div 
          className="absolute inset-0"
          style={backgroundConfig.style}
        />
      )}

      {/* Floating dots animation */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingDots.map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              delay: dot.delay,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
