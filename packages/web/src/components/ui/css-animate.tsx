"use client";

import { useEffect, useState, type ReactNode } from "react";

interface FadeInUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Lightweight CSS-only replacement for framer-motion's FadeInUp.
 * Avoids loading the 197KB framer-motion bundle on pages that only
 * need a simple fade + translate animation.
 */
export function FadeInUp({ children, delay = 0, className = "" }: FadeInUpProps) {
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}
