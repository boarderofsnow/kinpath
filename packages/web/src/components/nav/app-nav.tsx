"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  BookOpen,
  Settings,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChild } from "@/lib/contexts/child-context";
import { ChildPillSelector } from "@/components/nav/child-pill-selector";
import { enrichChildWithAge } from "@kinpath/shared";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Plan", href: "/plan", icon: ClipboardList },
  { label: "Browse", href: "/resources", icon: BookOpen },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedChildId, setSelectedChildId, children: contextChildren, setChildren } = useChild();
  const [fallbackLoaded, setFallbackLoaded] = useState(false);

  // Fallback client-side fetch for pages that don't hydrate context (loading states, resource/[slug])
  useEffect(() => {
    if (contextChildren.length > 0 || fallbackLoaded) return;
    const supabase = createClient();
    supabase
      .from("children")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setChildren(data.map((child) => enrichChildWithAge(child)));
        }
        setFallbackLoaded(true);
      });
  }, [contextChildren.length, fallbackLoaded, setChildren]);

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const showAll = !isDashboard;
  const showPillStrip = contextChildren.length > 0 && (contextChildren.length > 1 || showAll);

  function handleSelectChild(id: string | "all") {
    setSelectedChildId(id);
    // Sync URL param for the resources page (server-side personalization)
    if (pathname === "/resources") {
      const params = new URLSearchParams(window.location.search);
      if (id === "all") {
        params.delete("child");
      } else {
        params.set("child", id);
      }
      const qs = params.toString();
      router.push(qs ? `/resources?${qs}` : "/resources");
    }
  }

  return (
    <>
      {/* ── Desktop top nav (hidden on mobile) ────────────────── */}
      <div className="hidden sm:block">
        {/* Row 1: Logo + nav links */}
        <div className="border-b border-stone-200/60 bg-white">
          <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
            {/* Logo — left */}
            <Link href="/dashboard" prefetch={false} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kinpath-logo.png"
                alt="Kinpath"
                width={128}
                height={32}
                className="h-8 w-auto"
              />
            </Link>

            {/* Nav links — center */}
            <nav className="flex flex-1 items-center justify-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "font-semibold text-brand-600"
                        : "text-stone-600 hover:text-brand-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full bg-brand-500" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Row 2: Child pill strip */}
        {showPillStrip && (
          <div className="border-b border-stone-200/40 bg-stone-50/60">
            <div className="mx-auto flex max-w-5xl justify-center px-4 py-1.5">
              <ChildPillSelector
                childProfiles={contextChildren}
                selectedChildId={selectedChildId}
                onSelect={handleSelectChild}
                showAll={showAll}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile bottom tab bar (shown on mobile only) ──────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/60 bg-white/95 backdrop-blur-sm sm:hidden">
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-brand-600"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-brand-500" : ""}`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Mobile top bar with logo + child pills (shown on mobile) ──── */}
      <div className="sm:hidden">
        <div className="border-b border-stone-200/60 bg-white px-4 py-3">
          <Link href="/dashboard" prefetch={false}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kinpath-logo.png"
              alt="Kinpath"
              width={112}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Child pill strip — below logo bar */}
        {showPillStrip && (
          <div className="border-b border-stone-200/40 bg-stone-50/60 px-3 py-1.5">
            <ChildPillSelector
              childProfiles={contextChildren}
              selectedChildId={selectedChildId}
              onSelect={handleSelectChild}
              showAll={showAll}
            />
          </div>
        )}
      </div>
    </>
  );
}
