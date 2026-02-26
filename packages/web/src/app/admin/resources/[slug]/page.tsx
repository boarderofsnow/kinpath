import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { AdminResourceActions } from "@/components/admin/admin-resource-actions";

interface AdminResourceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminResourceDetailPage({ params }: AdminResourceDetailPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch the resource with reviewer info
  const { data: resource } = await supabase
    .from("resources")
    .select(`
      id, title, slug, summary, body, resource_type, source_url,
      age_start_weeks, age_end_weeks, status, is_premium,
      vetted_at, vetted_by, created_at, updated_at, assigned_reviewer_id,
      reviewers!resources_assigned_reviewer_id_fkey(id, full_name, credentials, specialty)
    `)
    .eq("slug", slug)
    .single();

  if (!resource) notFound();

  // Fetch all available reviewers for assignment dropdown
  const { data: reviewers } = await supabase
    .from("reviewers")
    .select("id, full_name, credentials, specialty")
    .eq("active", true)
    .order("full_name");

  // Fetch all professional reviews for this resource
  const { data: reviews } = await supabase
    .from("professional_reviews")
    .select(`
      id, status, review_notes, credentials_verified, reviewed_at,
      reviewers(id, full_name, credentials)
    `)
    .eq("resource_id", resource.id)
    .order("reviewed_at", { ascending: false });

  const assignedReviewer = (resource as Record<string, unknown>).reviewers as { id: string; full_name: string; credentials: string; specialty?: string | null } | null;

  const ageLabel = (weeks: number) => {
    if (weeks < 0) return `${Math.abs(weeks)}w before birth`;
    if (weeks < 4) return `${weeks}w`;
    if (weeks < 52) return `${Math.round(weeks / 4.33)}mo`;
    return `${Math.round(weeks / 52)}yr`;
  };

  const REVIEW_STATUS_COLORS: Record<string, string> = {
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
    needs_revision: "bg-amber-100 text-amber-700",
  };

  const RESOURCE_STATUS_COLORS: Record<string, string> = {
    draft: "bg-stone-100 text-stone-600",
    in_review: "bg-amber-100 text-amber-700",
    published: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-600",
    archived: "bg-stone-50 text-stone-400",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href="/admin/resources"
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ← Back to Resources
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-900 line-clamp-2">
            {resource.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-400">
            <span className="font-mono">{resource.slug}</span>
            <span>·</span>
            <span className="capitalize">{resource.resource_type}</span>
            <span>·</span>
            <span>
              {ageLabel(resource.age_start_weeks)} – {ageLabel(resource.age_end_weeks)}
            </span>
            {resource.is_premium && (
              <>
                <span>·</span>
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-accent-700">
                  Premium
                </span>
              </>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium capitalize ${
            RESOURCE_STATUS_COLORS[resource.status]
          }`}
        >
          {resource.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Left: resource preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary */}
          <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Summary
            </h2>
            <p className="mt-2 text-sm text-stone-700">{resource.summary}</p>
          </div>

          {/* Body */}
          <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4">
              Content
            </h2>
            <MarkdownBody content={resource.body} />
          </div>

          {resource.source_url && (
            <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
              <span className="text-xs font-medium text-stone-400">Source: </span>
              <a
                href={resource.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-600 hover:underline break-all"
              >
                {resource.source_url}
              </a>
            </div>
          )}

          {/* Professional Reviews */}
          <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Professional Reviews ({reviews?.length ?? 0})
            </h2>
            {reviews && reviews.length > 0 ? (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => {
                  const rev = (review as Record<string, unknown>).reviewers as { full_name?: string; credentials?: string } | null;
                  return (
                    <div key={review.id} className="rounded-xl border border-stone-100 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-stone-800">
                            {rev?.full_name ?? "Unknown Reviewer"}
                            {rev?.credentials && (
                              <span className="ml-1.5 text-xs text-stone-400">
                                ({rev.credentials})
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(review.reviewed_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            REVIEW_STATUS_COLORS[review.status]
                          }`}
                        >
                          {review.status.replace("_", " ")}
                        </span>
                      </div>
                      {review.review_notes && (
                        <p className="mt-2 text-sm text-stone-600">{review.review_notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-400">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Right: actions panel */}
        <div className="space-y-4">
          <AdminResourceActions
            resourceId={resource.id}
            resourceSlug={resource.slug}
            currentStatus={resource.status}
            assignedReviewerId={resource.assigned_reviewer_id ?? null}
            assignedReviewer={assignedReviewer ?? null}
            reviewers={reviewers ?? []}
            vettedAt={resource.vetted_at}
          />

          {/* Metadata */}
          <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Metadata
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Created</dt>
                <dd className="text-stone-700">
                  {new Date(resource.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-stone-400">Updated</dt>
                <dd className="text-stone-700">
                  {new Date(resource.updated_at).toLocaleDateString()}
                </dd>
              </div>
              {resource.vetted_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-stone-400">Vetted</dt>
                  <dd className="text-stone-700">
                    {new Date(resource.vetted_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
