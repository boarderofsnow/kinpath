export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600",
  in_review: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  archived: "bg-stone-50 text-stone-400",
};

export default async function ReviewerDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get the reviewer record for this user
  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("id, full_name, credentials")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!reviewer) redirect("/dashboard");

  // Get resources assigned to this reviewer
  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, slug, resource_type, status, summary, created_at")
    .eq("assigned_reviewer_id", reviewer.id)
    .order("created_at", { ascending: false });

  // Get existing reviews submitted by this reviewer
  const { data: myReviews } = await supabase
    .from("professional_reviews")
    .select("resource_id, status, reviewed_at")
    .eq("reviewer_id", reviewer.id);

  const reviewedResourceIds = new Set((myReviews ?? []).map((r) => r.resource_id));

  const pending = (resources ?? []).filter((r) => !reviewedResourceIds.has(r.id));
  const reviewed = (resources ?? []).filter((r) => reviewedResourceIds.has(r.id));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-stone-900">My Review Queue</h1>
        <p className="mt-1 text-sm text-stone-500">
          Resources assigned to you for review.
        </p>
      </div>

      {/* Pending review */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
          Awaiting Review ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pending.map((resource) => (
                  <tr key={resource.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-stone-900 line-clamp-1">{resource.title}</p>
                      <p className="text-xs text-stone-400 line-clamp-1">{resource.summary}</p>
                    </td>
                    <td className="px-5 py-3 capitalize text-stone-600">{resource.resource_type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          STATUS_COLORS[resource.status]
                        }`}
                      >
                        {resource.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/review/${resource.slug}`}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-stone-200/60 bg-white p-8 text-center text-stone-400 shadow-card">
            No resources pending review. Check back later!
          </div>
        )}
      </section>

      {/* Already reviewed */}
      {reviewed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
            Previously Reviewed ({reviewed.length})
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reviewed.map((resource) => {
                  const myReview = (myReviews ?? []).find(
                    (r) => r.resource_id === resource.id
                  );
                  return (
                    <tr key={resource.id} className="hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-stone-900 line-clamp-1">{resource.title}</p>
                      </td>
                      <td className="px-5 py-3 capitalize text-stone-600">{resource.resource_type}</td>
                      <td className="px-5 py-3">
                        {myReview && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              myReview.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : myReview.status === "needs_revision"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {myReview.status.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/review/${resource.slug}`}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                        >
                          Update
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
