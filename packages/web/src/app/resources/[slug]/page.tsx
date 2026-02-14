export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TOPICS, type TopicKey } from "@kinpath/shared";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { UnvettedIndicator } from "@/components/ui/vetted-badge";

interface ResourcePageProps {
  params: Promise<{ slug: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  checklist: "Checklist",
  video: "Video",
  guide: "Guide",
  infographic: "Infographic",
};

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch the resource by slug, with its topic associations
  const { data: resource, error } = await supabase
    .from("resources")
    .select(`
      *,
      resource_topics(topic_id)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !resource) {
    notFound();
  }

  const topics: string[] = (
    (resource.resource_topics as { topic_id: string }[] | null) ?? []
  ).map((t) => t.topic_id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back to feed
      </Link>

      {/* Resource header */}
      <header className="mt-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-500">
            {TYPE_LABELS[resource.resource_type as string] ?? resource.resource_type}
          </span>
          <UnvettedIndicator />
        </div>

        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          {resource.title as string}
        </h1>

        <p className="mt-3 text-base text-gray-600 leading-relaxed">
          {resource.summary as string}
        </p>

        {/* Topic pills */}
        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.map((topic) => {
              const label =
                TOPICS[topic as TopicKey]?.label ?? topic.replace(/_/g, " ");
              return (
                <span
                  key={topic}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
      </header>

      {/* Divider */}
      <hr className="mt-6 border-gray-200" />

      {/* Resource body (markdown) */}
      <article className="mt-6">
        <MarkdownBody content={resource.body as string} />
      </article>

      {/* Source attribution */}
      {resource.source_url && (
        <div className="mt-8 rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Source: </span>
            <a
              href={resource.source_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 underline hover:text-brand-700"
            >
              {resource.source_url as string}
            </a>
          </p>
        </div>
      )}

      {/* Back to feed */}
      <div className="mt-10 border-t border-gray-200 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
