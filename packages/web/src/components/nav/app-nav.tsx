"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Home,
  BookOpen,
  Settings,
  MessageCircle,
  ClipboardList,
  ChevronDown,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChild } from "@/lib/contexts/child-context";

interface ChildOption {
  id: string;
  name: string;
}

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
  const { selectedChildId, setSelectedChildId } = useChild();
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("children")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setChildren(data);
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelectChild(id: string | "all") {
    setSelectedChildId(id);
    setDropdownOpen(false);
    // For the resources (Browse) page, also update the URL param so server-side
    // personalized feed continues to work.
    if (pathname === "/resources") {
      // Use window.location.search to preserve existing query params (runs in click handler, always client-side)
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

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const displayLabel = selectedChild ? selectedChild.name : "All Children";
  const showSelector = children.length > 0;

  return (
    <>
      {/* ── Desktop top nav (hidden on mobile) ────────────────── */}
      <div className="hidden border-b border-stone-200/60 bg-white sm:block">
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

          {/* Child selector — right */}
          {showSelector && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <Users className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                <span>{displayLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-stone-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-lg"
                >
                  <button
                    role="option"
                    aria-selected={selectedChildId === "all"}
                    onClick={() => handleSelectChild("all")}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50 ${
                      selectedChildId === "all"
                        ? "font-semibold text-brand-600"
                        : "text-stone-700"
                    }`}
                  >
                    All Children
                  </button>
                  {children.map((child) => (
                    <button
                      key={child.id}
                      role="option"
                      aria-selected={selectedChildId === child.id}
                      onClick={() => handleSelectChild(child.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50 ${
                        selectedChildId === child.id
                          ? "font-semibold text-brand-600"
                          : "text-stone-700"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-600">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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

      {/* ── Mobile top bar with logo only (shown on mobile) ──── */}
      <div className="border-b border-stone-200/60 bg-white px-4 py-3 sm:hidden">
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
    </>
  );
}
