"use client";

import type { ReactNode } from "react";
import { useRef, useEffect, useState } from "react";

/**
 * Lightweight CSS-based animation replacements for framer-motion.
 * These provide the same visual effects with zero bundle cost.
 * All components respect prefers-reduced-motion.
 *
 * SSR safety: content is always visible in server-rendered HTML.
 * Scroll animations are progressive enhancement — they only activate
 * after client JS confirms the element is off-screen on mount.
 */

interface MotionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  return reduced;
}

/* ── Fade In ─────────────────────────────────────────────── */

export function FadeIn({ children, delay = 0, className = "" }: MotionProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

/* ── Fade In Up ──────────────────────────────────────────── */

export function FadeInUp({
  children,
  delay = 0,
  className = "",
}: MotionProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

/* ── Scroll Reveal ───────────────────────────────────────── */

export function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: MotionProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setInitialized(true);
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    // If element is already in viewport on mount, show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "-60px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  // SSR / pre-hydration: always show content (no opacity-0 in server HTML)
  // Post-hydration: hide off-screen elements until they scroll into view
  const showContent = !initialized || reduced || visible;

  return (
    <div
      ref={ref}
      className={`${showContent ? (visible && !reduced ? "animate-fade-in-up" : "") : "opacity-0"} ${className}`}
      style={
        visible && !reduced
          ? { animationDelay: `${delay}s`, animationFillMode: "both" }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/* ── Stagger Container + Item ────────────────────────────── */

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className = "",
}: StaggerContainerProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setInitialized(true);
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    // If element is already in viewport on mount, show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "-60px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  const showContent = !initialized || reduced || visible;

  return (
    <div
      ref={ref}
      className={`${showContent ? (visible && !reduced ? "stagger-visible" : "") : "stagger-hidden"} ${className}`}
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: Omit<MotionProps, "delay">) {
  return (
    <div className={`stagger-item ${className}`}>
      {children}
    </div>
  );
}

/* ── Page Transition Wrapper ─────────────────────────────── */

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div className={`animate-fade-in-up ${className}`} style={{ animationDuration: "0.3s" }}>
      {children}
    </div>
  );
}
