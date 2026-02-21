export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BookOpen, Clock, CheckCircle2, XCircle, Archive } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: { label: "Draft", icon: <Clock className="h-5 w-5" />, color: "text-stone-500 bg-stone-100" },
  in_review: { label: "In Review", icon: <Clock className="h-5 w-5" />, color: "text-amber-600 bg-amber-50" },
  published: { label: "Published", icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
  rejected: { label: "Rejected", icon: <XCircle className="h-5 w-5" />, color: "text-red-600 bg-red-50" },
  archived: { label: "Archived", icon: <Archive className="h-5 w-5" />, color: "text-stone-400 bg-stone-50" },
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Count resources by status
  const { data: counts } = await supabase
    .from("resources")
    .select("status");

  const statusCounts: Record<string, number> = {};
  for (const row of counts ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  const total = (counts ?? []).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">
        Manage resources, reviews, and physician assignments.
      </p>

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <BookOpen className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{total}</p>
              <p className="text-sm text-stone-500">Total Resources</p>
            </div>
          </div>
        </div>

        {Object.entries(STATUS_LABELS).map(([status, { label, icon, color }]) => (
          <Link
            key={status}
            href={`/admin/resources?status=${status}`}
            className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-card transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">
                  {statusCounts[status] ?? 0}
                </p>
                <p className="text-sm text-stone-500">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Quick Actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/admin/resources?status=draft"
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
          >
            View Drafts →
          </Link>
          <Link
            href="/admin/resources?status=in_review"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition-colors hover:bg-amber-100"
          >
            View In Review →
          </Link>
          <Link
            href="/admin/resources?status=published"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-100"
          >
            View Published →
          </Link>
        </div>
      </div>
    </div>
  );
}
