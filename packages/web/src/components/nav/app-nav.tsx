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
      {/* ── Top bar: logo + child pills ──────────────────────── */}
      <div className="flex items-center justify-between border-b border-stone-200/60 bg-white px-4 py-2.5 sm:py-3">
        <Link href="/dashboard" prefetch={false} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kinpath-logo.png"
            alt="Kinpath"
            width={128}
            height={32}
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        {showPillStrip && (
          <div className="scrollbar-hide ml-4 min-w-0 flex-1 overflow-x-auto sm:flex-initial">
            <ChildPillSelector
              childProfiles={contextChildren}
              selectedChildId={selectedChildId}
              onSelect={handleSelectChild}
              showAll={showAll}
            />
          </div>
        )}
      </div>

      {/* ── Floating bottom nav bar ──────────────────────────── */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:bottom-6">
        <nav className="flex items-center gap-1 rounded-2xl border border-stone-200/50 bg-white/80 px-2 py-2 shadow-card backdrop-blur-xl sm:gap-2 sm:px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-all sm:flex-row sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                }`}
              >
                <Icon
                  className={`h-5 w-5 sm:h-4 sm:w-4 ${isActive ? "text-white" : ""}`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
