export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge, getDevelopmentStage } from "@kinpath/shared";
import { PregnancyDashboard } from "@/components/onboarding/pregnancy-dashboard";
import { ResourceFeed } from "@/components/feed/resource-feed";
import { SearchBar } from "@/components/search/search-bar";
import { getPersonalizedFeed } from "@/lib/resources";

interface DashboardPageProps {
  searchParams: Promise<{ child?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Check if onboarding is complete
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  // Fetch children
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // Determine active child (from URL param, or default to first)
  const activeChild = params.child
    ? enrichedChildren.find((c) => c.id === params.child) ?? enrichedChildren[0]
    : enrichedChildren[0];

  // Fetch personalized, age-filtered resources
  const { resources, preferences } = activeChild
    ? await getPersonalizedFeed(user.id, activeChild.age_in_weeks)
    : { resources: [], preferences: null };

  const userTopics = preferences?.topics_of_interest ?? [];
  const stage = activeChild ? getDevelopmentStage(activeChild.age_in_weeks) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back
            {profile.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          {activeChild && (
            <p className="mt-1 text-sm text-stone-600">
              {activeChild.name} &mdash; {activeChild.age_label}
              {stage && (
                <span className="ml-2 inline-flex items-center rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                  {stage}
                </span>
              )}
            </p>
          )}
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/resources"
            className="text-sm font-medium text-stone-600 hover:text-brand-600"
          >
            Browse All
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-stone-600 hover:text-brand-600"
          >
            Settings
          </Link>
        </nav>
      </header>

      {/* Search bar */}
      <div className="mt-6 max-w-md">
        <SearchBar compact placeholder="Search all resources..." />
      </div>

      {/* Child tabs (if multiple children) */}
      {enrichedChildren.length > 1 && (
        <div className="mt-6 flex gap-2">
          {enrichedChildren.map((child) => (
            <Link
              key={child.id}
              href={`/dashboard?child=${child.id}`}
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

      {/* Pregnancy Dashboard (for expecting parents) */}
      {activeChild && !activeChild.is_born && (
        <section className="mt-8">
          <PregnancyDashboard child={activeChild} />
        </section>
      )}

      {/* Resource Feed */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">Your Resources</h2>
        <p className="mt-1 text-sm text-stone-500">
          Personalized for {activeChild?.name ?? "your child"} &mdash;
          showing age-appropriate content based on your interests.
        </p>

        <div className="mt-4">
          {resources.length > 0 ? (
            <ResourceFeed resources={resources} userTopics={userTopics} />
          ) : (
            <div className="rounded-xl bg-white p-8 text-center shadow-card">
              <p className="text-stone-500">
                No resources found for this age range yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="mt-12 rounded-2xl border border-sage-200/60 bg-sage-50 p-6 shadow-card">
        <h3 className="font-semibold text-sage-800">Have a question?</h3>
        <p className="mt-1 text-sm text-sage-600">
          Ask our AI assistant anything about parenting, nutrition, sleep, and
          more. Answers are grounded in our professionally-vetted resource
          library.
        </p>
        <button className="mt-4 rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-accent-600 transition-colors">
          Ask a Question
        </button>
      </section>
    </div>
  );
}
