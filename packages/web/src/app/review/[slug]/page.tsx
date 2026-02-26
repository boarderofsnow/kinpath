import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { ReviewForm } from "@/components/review/review-form";

interface ReviewResourcePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReviewResourcePage({ params }: ReviewResourcePageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/auth/login");

  // Get reviewer record
  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("id, full_name, credentials")
    .eq("user_id", user.id)
    .eq("active", true)
    .single();

  if (!reviewer) redirect("/dashboard");

  // Fetch the resource
  const { data: resource } = await supabase
    .from("resources")
    .select("id, title, slug, summary, body, resource_type, source_url, age_start_weeks, age_end_weeks, status")
    .eq("slug", slug)
    .eq("assigned_reviewer_id", reviewer.id)
    .single();

  if (!resource) notFound();

  // Check for an existing review from this reviewer
  const { data: existingReview } = await supabase
    .from("professional_reviews")
    .select("id, status, review_notes, credentials_verified, reviewed_at")
    .eq("resource_id", resource.id)
    .eq("reviewer_id", reviewer.id)
    .maybeSingle();

  const ageLabel = (weeks: number) => {
    if (weeks < 0) return `${Math.abs(weeks)}w before birth`;
    if (weeks < 4) return `${weeks}w`;
    if (weeks < 52) return `${Math.round(weeks / 4.33)}mo`;
    return `${Math.round(weeks / 52)}yr`;
  };

  return (
    <div>
      {/* Header */}
      <Link href="/review" className="text-xs text-stone-400 hover:text-stone-600">
        ← Back to Queue
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{resource.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-400">
            <span className="capitalize">{resource.resource_type}</span>
            <span>·</span>
            <span>
              {ageLabel(resource.age_start_weeks)} – {ageLabel(resource.age_end_weeks)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Resource content */}
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
        </div>

        {/* Review form */}
        <div>
          <ReviewForm
            resourceId={resource.id}
            resourceSlug={resource.slug}
            reviewerId={reviewer.id}
            existingReview={
              existingReview
                ? {
                    id: existingReview.id,
                    status: existingReview.status as "approved" | "rejected" | "needs_revision",
                    review_notes: existingReview.review_notes ?? "",
                    credentials_verified: existingReview.credentials_verified,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
