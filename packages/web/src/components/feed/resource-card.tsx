import type { ResourceWithMeta } from "@kinpath/shared";
import { VettedBadge, UnvettedIndicator } from "../ui/vetted-badge";

interface ResourceCardProps {
  resource: ResourceWithMeta;
}

/**
 * A card displaying a single resource in the feed.
 * Shows the vetted badge when applicable.
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  const typeLabels: Record<string, string> = {
    article: "Article",
    checklist: "Checklist",
    video: "Video",
    guide: "Guide",
    infographic: "Infographic",
  };

  return (
    <article className="group rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header with type and vetting status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-500">
          {typeLabels[resource.resource_type] ?? resource.resource_type}
        </span>
        {resource.is_vetted && resource.vetting_info ? (
          <VettedBadge vettingInfo={resource.vetting_info} />
        ) : (
          <UnvettedIndicator />
        )}
      </div>

      {/* Title and summary */}
      <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
        {resource.title}
      </h3>
      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
        {resource.summary}
      </p>

      {/* Topics */}
      {resource.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {resource.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600"
            >
              {topic.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
