import Link from "next/link";
import {
  Home,
  BookOpen,
  Settings,
  MessageCircle,
  ClipboardList,
} from "lucide-react";

interface AppNavProps {
  currentPath: string; // e.g. "/dashboard", "/resources", "/settings"
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Plan", href: "/plan", icon: ClipboardList },
  { label: "Browse", href: "/resources", icon: BookOpen },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppNav({ currentPath }: AppNavProps) {
  return (
    <>
      {/* ── Desktop top nav (hidden on mobile) ────────────────── */}
      <div className="hidden border-b border-stone-200/60 bg-white sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kinpath-logo.png"
              alt="KinPath"
              className="h-8 w-auto"
            />
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "font-semibold text-brand-600"
                      : "text-stone-600 hover:text-brand-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {/* Active underline indicator */}
                  {isActive && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Mobile bottom tab bar (shown on mobile only) ──────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/60 bg-white/95 backdrop-blur-sm sm:hidden">
        <nav className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-brand-600"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-brand-500" : ""}`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Mobile top bar with logo only (shown on mobile) ──── */}
      <div className="border-b border-stone-200/60 bg-white px-4 py-3 sm:hidden">
        <Link href="/dashboard">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kinpath-logo.png"
            alt="KinPath"
            className="h-7 w-auto"
          />
        </Link>
      </div>
    </>
  );
}
