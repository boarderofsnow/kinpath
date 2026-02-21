export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600",
  in_review: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  archived: "bg-stone-50 text-stone-400",
};

const ALL_STATUSES = ["draft", "in_review", "published", "rejected", "archived"];

interface AdminResourcesPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminResourcesPage({ searchParams }: AdminResourcesPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("resources")
    .select(`
      id, title, slug, resource_type, status, is_premium,
      vetted_at, created_at, assigned_reviewer_id,
      reviewers!resources_assigned_reviewer_id_fkey(id, full_name, credentials)
    `)
    .order("created_at", { ascending: false });

  if (params.status && ALL_STATUSES.includes(params.status)) {
    query = query.eq("status", params.status);
  }

  const { data: resources } = await query;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Resources</h1>
          <p className="mt-1 text-sm text-stone-500">
            {resources?.length ?? 0} resource{resources?.length !== 1 ? "s" : ""}
            {params.status ? ` · ${params.status.replace("_", " ")}` : ""}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/resources"
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !params.status ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/resources?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              params.status === s
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Resource table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-card">
        {resources && resources.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Reviewer</th>
                <th className="px-5 py-3">Vetted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {resources.map((resource) => {
                const reviewer = (resource as Record<string, unknown>).reviewers as { full_name?: string; credentials?: string } | null;
                return (
                  <tr key={resource.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-stone-900 line-clamp-1">{resource.title}</p>
                      <p className="text-xs text-stone-400">{resource.slug}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-stone-600">{resource.resource_type}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[resource.status]}`}>
                        {resource.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {reviewer ? (
                        <span>
                          {reviewer.full_name}{" "}
                          <span className="text-stone-400">({reviewer.credentials})</span>
                        </span>
                      ) : (
                        <span className="text-stone-300">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-500">
                      {resource.vetted_at
                        ? new Date(resource.vetted_at).toLocaleDateString()
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/resources/${resource.slug}`}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-stone-400">
            No resources found{params.status ? ` with status "${params.status.replace("_", " ")}"` : ""}.
          </div>
        )}
      </div>
    </div>
  );
}
