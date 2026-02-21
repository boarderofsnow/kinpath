import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClipboardList } from "lucide-react";

export default async function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check if this user is an active reviewer
  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("id, full_name, credentials")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!reviewer) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-stone-200 bg-white">
        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            Reviewer Portal
          </p>
          <p className="mt-0.5 text-base font-bold text-stone-900">{reviewer.full_name}</p>
          <p className="text-xs text-stone-400">{reviewer.credentials}</p>
        </div>
        <nav className="mt-2 px-3">
          <Link
            href="/review"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <ClipboardList className="h-4 w-4" />
            My Reviews
          </Link>
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
