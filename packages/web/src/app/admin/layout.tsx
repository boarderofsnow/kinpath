import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LayoutDashboard, BookOpen, Users } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/resources", label: "Resources", icon: BookOpen },
    { href: "/admin/reviewers", label: "Reviewers", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-stone-200 bg-white">
        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Admin
          </p>
          <p className="mt-0.5 text-lg font-bold text-stone-900">KinPath</p>
        </div>
        <nav className="mt-2 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 px-5">
          <Link
            href="/dashboard"
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto px-8 py-8">{children}</main>
    </div>
  );
}
