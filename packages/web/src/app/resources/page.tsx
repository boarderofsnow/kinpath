import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TOPICS, TOPIC_KEYS, type TopicKey } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { searchResources } from "@/lib/search";
import { ResourceCard } from "@/components/feed/resource-card";
import { SearchBar } from "@/components/search/search-bar";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; topic?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/auth/login");

  const query = params.q ?? "";
  const activeTopic = params.topic ?? "";

  // Parallel — profile + search
  const [{ data: profile }, { resources, total }] = await Promise.all([
    supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single(),
    searchResources({
      query: query || undefined,
      topic: activeTopic || undefined,
      existingClient: supabase,
    }),
  ]);

  const tier = profile?.subscription_tier ?? "free";
  const isFree = tier === "free";

  return (
    <>
      <AppNav currentPath="/resources" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Browse Resources</h1>
          <p className="mt-1 text-sm text-stone-500">
            Search and explore our full library of evidence-based parenting resources.
          </p>
        </div>

      {/* Search bar */}
      <div className="mt-6 max-w-xl">
        <SearchBar placeholder="Search by title or keyword..." />
      </div>

      {/* Topic filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={query ? `/resources?q=${encodeURIComponent(query)}` : "/resources"}
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
          const href = query
            ? `/resources?q=${encodeURIComponent(query)}&topic=${key}`
            : `/resources?topic=${key}`;

          return (
            <Link
              key={key}
              href={href}
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
            Showing {resources.length} resource{resources.length !== 1 ? "s" : ""} in{" "}
            <span className="font-medium">{TOPICS[activeTopic as TopicKey]?.label ?? activeTopic}</span>
          </p>
        )}
      </div>

      {/* Results grid */}
      {resources.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(isFree ? resources.slice(0, 6) : resources).map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
          {isFree && resources.length > 6 && (
            <div className="mt-6">
              <UpgradeBanner feature="the full resource library" />
            </div>
          )}
        </>
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
              : "No resources available for this topic yet."}
          </p>
          {query && (
            <Link
              href="/resources"
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Clear search and browse all
            </Link>
          )}
        </div>
      )}
      </div>
    </>
  );
}
