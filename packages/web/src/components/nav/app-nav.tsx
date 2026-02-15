import Link from "next/link";
import { Home, BookOpen, Settings, MessageCircle } from "lucide-react";

interface AppNavProps {
  currentPath: string; // e.g. "/dashboard", "/resources", "/settings"
}

export function AppNav({ currentPath }: AppNavProps) {
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      label: "Browse",
      href: "/resources",
      icon: BookOpen,
    },
    {
      label: "Chat",
      href: "/chat",
      icon: MessageCircle,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="border-b border-stone-200/60 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold text-brand-600">
          KinPath
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
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-brand-600 font-semibold"
                    : "text-stone-600 hover:text-brand-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
