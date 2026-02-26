"use client";

import { useState, useMemo, useTransition } from "react";
import { BookOpen } from "lucide-react";
import { ResourceCard } from "./resource-card";
import { TOPICS, type TopicKey } from "@kinpath/shared";
import type { ResourceWithMeta } from "@kinpath/shared";

interface ResourceFeedProps {
  resources: ResourceWithMeta[];
  userTopics: string[];
}

/**
 * Client component that renders the resource feed with interactive topic filtering.
 * Resources are pre-scored and sorted server-side; this component handles
 * client-side filtering and display.
 */
export function ResourceFeed({ resources, userTopics }: ResourceFeedProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Gather unique topics and sort: user's preferred first
  const { sortedTopics, topicCounts } = useMemo(() => {
    const feedTopics = [...new Set(resources.flatMap((r) => r.topics))];
    const sorted = [
      ...feedTopics.filter((t) => userTopics.includes(t)),
      ...feedTopics.filter((t) => !userTopics.includes(t)),
    ];
    const counts = sorted.reduce<Record<string, number>>(
      (acc, topic) => {
        acc[topic] = resources.filter((r) => r.topics.includes(topic)).length;
        return acc;
      },
      {}
    );
    return { sortedTopics: sorted, topicCounts: counts };
  }, [resources, userTopics]);

  const filtered = useMemo(
    () =>
      activeFilter
        ? resources.filter((r) => r.topics.includes(activeFilter))
        : resources,
    [resources, activeFilter]
  );

  return (
    <div>
      {/* Topic filter pills */}
      {sortedTopics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => startTransition(() => setActiveFilter(null))}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              !activeFilter
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 shadow-sm"
            }`}
          >
            All ({resources.length})
          </button>
          {sortedTopics.map((topicKey) => {
            const topicInfo = TOPICS[topicKey as TopicKey];
            const isUserTopic = userTopics.includes(topicKey);
            const isActive = activeFilter === topicKey;

            return (
              <button
                key={topicKey}
                onClick={() =>
                  startTransition(() => setActiveFilter(isActive ? null : topicKey))
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors shadow-sm ${
                  isActive
                    ? "bg-brand-500 text-white"
                    : isUserTopic
                      ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                }`}
              >
                {topicInfo?.label ?? topicKey.replace(/_/g, " ")}
                <span className="ml-1 opacity-60">
                  {topicCounts[topicKey]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Resource grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-8 text-center shadow-card">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-stone-300" />
          <p className="text-stone-500">
            No resources match this filter.
          </p>
          <p className="mt-1 text-sm text-stone-400">
            Try selecting a different topic or browse all resources.
          </p>
        </div>
      )}
    </div>
  );
}
