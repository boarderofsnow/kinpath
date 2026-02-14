import Link from "next/link";
import type { ResourceWithMeta } from "@kinpath/shared";
import { TOPICS, type TopicKey } from "@kinpath/shared";
import { VettedBadge, UnvettedIndicator } from "../ui/vetted-badge";

interface ResourceCardProps {
  resource: ResourceWithMeta;
}

const TYPE_LABELS: Record<string, string> = {
  article: "Article",
  checklist: "Checklist",
  video: "Video",
  guide: "Guide",
  infographic: "Infographic",
};

/**
 * A card displaying a single resource in the feed.
 * Links to the full resource detail page on click.
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Link
      href={`/resources/${resource.slug}`}
      className="block rounded-2xl border border-stone-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-brand-200 group"
    >
      {/* Header with type and vetting status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-500">
          {TYPE_LABELS[resource.resource_type] ?? resource.resource_type}
        </span>
        {resource.is_vetted && resource.vetting_info ? (
          <VettedBadge vettingInfo={resource.vetting_info} />
        ) : (
          <UnvettedIndicator />
        )}
      </div>

      {/* Title and summary */}
      <h3 className="mt-2 text-base font-semibold text-stone-900 group-hover:text-brand-600 transition-colors">
        {resource.title}
      </h3>
      <p className="mt-1 text-sm text-stone-600 line-clamp-2">
        {resource.summary}
      </p>

      {/* Topics */}
      {resource.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {resource.topics.slice(0, 3).map((topic) => {
            const label =
              TOPICS[topic as TopicKey]?.label ?? topic.replace(/_/g, " ");
            return (
              <span
                key={topic}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
              >
                {label}
              </span>
            );
          })}
        </div>
      )}
    </Link>
  );
}
