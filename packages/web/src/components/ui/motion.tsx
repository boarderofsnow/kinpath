"use client";

import type { ReactNode } from "react";
import { useRef, useEffect, useState } from "react";

/**
 * Lightweight CSS-based animation replacements for framer-motion.
 * These provide the same visual effects with zero bundle cost.
 */

interface MotionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

/* ── Fade In ─────────────────────────────────────────────── */

export function FadeIn({ children, delay = 0, className = "" }: MotionProps) {
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? "animate-fade-in-up" : "opacity-0"} ${className}`}
      style={visible ? { animationDelay: `${delay}s`, animationFillMode: "both" } : undefined}
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
  }, []);

  return (
    <div ref={ref} className={`${visible ? "stagger-visible" : "stagger-hidden"} ${className}`}>
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
  return (
    <div className={`animate-fade-in-up ${className}`} style={{ animationDuration: "0.3s" }}>
      {children}
    </div>
  );
}
