export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TOPICS, type TopicKey } from "@kinpath/shared";
import { MarkdownBody } from "@/components/ui/markdown-body";
import { UnvettedIndicator } from "@/components/ui/vetted-badge";
import { resolveSource } from "@/lib/sources";

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
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600 transition-colors"
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

        <h1 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
          {resource.title as string}
        </h1>

        <p className="mt-3 text-base text-stone-600 leading-relaxed">
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
      <hr className="mt-6 border-stone-200" />

      {/* Resource body (markdown) */}
      <article className="mt-6">
        <MarkdownBody content={resource.body as string} />
      </article>

      {/* Source attribution — links to the organization's reliable landing page */}
      {resource.source_url && (() => {
        const org = resolveSource(resource.source_url as string);
        return org ? (
          <div className="mt-8 rounded-lg bg-sage-50 p-4">
            <p className="text-sm text-sage-800">
              <span className="font-semibold">Source: {org.name}</span>
            </p>
            <p className="mt-1 text-xs text-sage-600">{org.authority}</p>
            <a
              href={org.reliableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:text-sage-900 transition-colors"
            >
              Visit {org.shortName}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>
        ) : (
          <div className="mt-8 rounded-lg bg-stone-50 p-4">
            <p className="text-sm text-stone-600">
              <span className="font-medium">Source: </span>
              <a
                href={resource.source_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline hover:text-brand-700"
              >
                {new URL(resource.source_url as string).hostname}
              </a>
            </p>
          </div>
        );
      })()}

      {/* Back to feed */}
      <div className="mt-10 border-t border-stone-200 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
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
