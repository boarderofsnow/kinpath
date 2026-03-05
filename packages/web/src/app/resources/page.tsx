import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge, getDevelopmentStage, TOPICS, TOPIC_KEYS, type TopicKey } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { searchResources } from "@/lib/search";
import { getPersonalizedFeed } from "@/lib/resources";
import { getHouseholdContext } from "@/lib/household";
import { ResourceCard } from "@/components/feed/resource-card";
import { SearchBar } from "@/components/search/search-bar";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; topic?: string; child?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/auth/login");

  const query = params.q ?? "";
  const activeTopic = params.topic ?? "";
  const childParam = params.child ?? "";

  // Step A: Parallel — profile + household context
  const [{ data: profile }, { effectiveOwnerId }] = await Promise.all([
    supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single(),
    getHouseholdContext(user.id, supabase),
  ]);

  // Step B: Fetch children for child selector
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", effectiveOwnerId)
    .order("created_at", { ascending: true });

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // Determine active child (from URL param)
  const activeChild = childParam
    ? enrichedChildren.find((c) => c.id === childParam) ?? null
    : null;

  // Step C: Fetch resources — personalized if child selected with no search/topic, otherwise full library
  const usePersonalized = !!activeChild && !query && !activeTopic;

  let resources: any[] = [];
  let total = 0;

  if (usePersonalized) {
    const { resources: personalizedResources } = await getPersonalizedFeed(
      user.id,
      activeChild.age_in_weeks,
      40,
      supabase
    );
    resources = personalizedResources;
    total = resources.length;
  } else {
    const result = await searchResources({
      query: query || undefined,
      topic: activeTopic || undefined,
      existingClient: supabase,
    });
    resources = result.resources;
    total = result.total;
  }

  const tier = profile?.subscription_tier ?? "free";
  const isFree = tier === "free";
  const canFilterByChild = !isFree;
  const displayResources = resources;

  /** Build an href that preserves other active params when switching child/topic/search */
  function browseHref(overrides: { child?: string | null; topic?: string | null; q?: string | null }) {
    const p = new URLSearchParams();
    const c = overrides.child !== undefined ? overrides.child : childParam;
    const t = overrides.topic !== undefined ? overrides.topic : activeTopic;
    const s = overrides.q !== undefined ? overrides.q : query;
    if (c) p.set("child", c);
    if (t) p.set("topic", t);
    if (s) p.set("q", s);
    const qs = p.toString();
    return qs ? `/resources?${qs}` : "/resources";
  }

  const stage = activeChild ? getDevelopmentStage(activeChild.age_in_weeks) : null;

  return (
    <>
      <AppNav currentPath="/resources" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Browse Resources</h1>
          <p className="mt-1 text-sm text-stone-500">
            {activeChild ? (
              <>
                Personalized for {activeChild.name} &mdash; {activeChild.age_label}
                {stage && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                    {stage}
                  </span>
                )}
              </>
            ) : (
              "Search and explore our full library of evidence-based parenting resources."
            )}
          </p>
        </div>

        {/* Child selector pills — premium+ only */}
        {enrichedChildren.length > 0 && canFilterByChild && (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={browseHref({ child: null })}
              prefetch={false}
              className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                !activeChild
                  ? "bg-brand-500 text-white"
                  : "bg-white text-stone-700 hover:bg-brand-50"
              }`}
            >
              All Resources
            </Link>
            {enrichedChildren.map((child) => (
              <Link
                key={child.id}
                href={browseHref({ child: child.id })}
                prefetch={false}
                className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                  activeChild?.id === child.id
                    ? "bg-brand-500 text-white"
                    : "bg-white text-stone-700 hover:bg-brand-50"
                }`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
        {enrichedChildren.length > 0 && !canFilterByChild && (
          <div className="mt-6">
            <UpgradeBanner feature="child-specific resource filtering" compact />
          </div>
        )}

        {/* Search bar */}
        <div className="mt-6 max-w-xl">
          <SearchBar placeholder="Search by title or keyword..." />
        </div>

        {/* Topic filter tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={browseHref({ topic: null })}
            prefetch={false}
            className={`rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
              !activeTopic
                ? "bg-brand-500 text-white"
                : "bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            All topics
          </Link>
          {TOPIC_KEYS.map((key) => {
            const topic = TOPICS[key];
            return (
              <Link
                key={key}
                href={browseHref({ topic: key })}
                prefetch={false}
                className={`rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                  activeTopic === key
                    ? "bg-brand-500 text-white"
                    : "bg-white text-stone-600 hover:bg-stone-50"
                }`}
              >
                {topic.label}
              </Link>
            );
          })}
        </div>

        {/* Results info */}
        <div className="mt-6">
          {query && (
            <p className="text-sm text-stone-500 mb-4">
              {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              {activeTopic && (
                <> in <span className="font-medium">{TOPICS[activeTopic as TopicKey]?.label ?? activeTopic}</span></>
              )}
            </p>
          )}
          {!query && activeTopic && (
            <p className="text-sm text-stone-500 mb-4">
              Showing {displayResources.length} resource{displayResources.length !== 1 ? "s" : ""} in{" "}
              <span className="font-medium">{TOPICS[activeTopic as TopicKey]?.label ?? activeTopic}</span>
            </p>
          )}
          {!query && !activeTopic && activeChild && (
            <p className="text-sm text-stone-500 mb-4">
              Showing {displayResources.length} age-appropriate resource{displayResources.length !== 1 ? "s" : ""} for {activeChild.name}
            </p>
          )}
        </div>

        {/* Results grid */}
        {displayResources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-white p-12 text-center shadow-card">
            <svg
              className="mx-auto h-12 w-12 text-stone-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <p className="mt-4 text-stone-500">
              {query
                ? `No resources found for "${query}". Try a different search term.`
                : activeChild
                  ? `No age-appropriate resources found for ${activeChild.name} yet. Try browsing all resources.`
                  : "No resources available for this topic yet."}
            </p>
            {(query || activeChild) && (
              <Link
                href="/resources"
                className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Clear filters and browse all
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
