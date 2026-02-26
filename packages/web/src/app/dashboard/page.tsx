import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { enrichChildWithAge, getDevelopmentStage } from "@kinpath/shared";
import type { ChecklistItem } from "@kinpath/shared";
import { AppNav } from "@/components/nav/app-nav";
import { PregnancyDashboard } from "@/components/onboarding/pregnancy-dashboard";
import { PostBirthDashboard } from "@/components/dashboard/post-birth-dashboard";
import { ResourceFeed } from "@/components/feed/resource-feed";
import { SearchBar } from "@/components/search/search-bar";
import { getPersonalizedFeed } from "@/lib/resources";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { getHouseholdContext } from "@/lib/household";
import { FadeInUp } from "@/components/ui/css-animate";

interface DashboardPageProps {
  searchParams: Promise<{ child?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/auth/login");

  // Step A: Parallel — profile + household context
  const [{ data: profile }, { effectiveOwnerId }] = await Promise.all([
    supabase
      .from("users")
      .select("onboarding_complete, display_name, subscription_tier")
      .eq("id", user.id)
      .single(),
    getHouseholdContext(user.id, supabase),
  ]);

  // If the profile query failed (null), don't mistakenly redirect to onboarding.
  if (!profile) {
    redirect("/auth/login");
  }

  if (!profile.onboarding_complete) {
    redirect("/onboarding");
  }

  // Step B: Fetch children (needs effectiveOwnerId)
  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", effectiveOwnerId)
    .order("created_at", { ascending: true });

  const enrichedChildren = (children ?? []).map((child) =>
    enrichChildWithAge(child)
  );

  // Determine active child (from URL param, or default to first)
  const activeChild = params.child
    ? enrichedChildren.find((c) => c.id === params.child) ?? enrichedChildren[0]
    : enrichedChildren[0];

  // Step C: Parallel — feed + checklist (both need activeChild)
  const feedPromise = activeChild
    ? getPersonalizedFeed(user.id, activeChild.age_in_weeks, 20, supabase)
    : Promise.resolve({ resources: [] as any[], preferences: null });

  const checklistPromise = activeChild?.is_born
    ? supabase
        .from("checklist_items")
        .select("*, checklist_item_children(child_id)")
        .eq("user_id", effectiveOwnerId)
        .order("sort_order", { ascending: true })
    : Promise.resolve({ data: null });

  const [{ resources, preferences }, { data: rawItems }] = await Promise.all([
    feedPromise,
    checklistPromise,
  ]);

  let activeChildChecklist: ChecklistItem[] = [];
  if (activeChild?.is_born && rawItems) {
    activeChildChecklist = (rawItems ?? []).map((row: any) => {
      const junctionRows = row.checklist_item_children ?? [];
      const childIds = junctionRows.map((j: { child_id: string }) => j.child_id);
      const { checklist_item_children: _, ...item } = row;
      return { ...item, child_ids: childIds } as ChecklistItem;
    }).filter((item: ChecklistItem) => {
      if (item.child_ids && item.child_ids.length > 0) {
        return item.child_ids.includes(activeChild.id);
      }
      return item.child_id === activeChild.id;
    });
  }

  const userTopics = preferences?.topics_of_interest ?? [];
  const stage = activeChild ? getDevelopmentStage(activeChild.age_in_weeks) : null;
  const tier = profile.subscription_tier ?? "free";
  const isFree = tier === "free";
  // Free users see a preview of 3 resources; paid users see all
  const displayResources = isFree ? resources.slice(0, 3) : resources;

  return (
    <>
      <AppNav currentPath="/dashboard" />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <FadeInUp>
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
        </header>
        </FadeInUp>

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

      {/* Post-Birth Dashboard (for born children) */}
      {activeChild && activeChild.is_born && (
        <section className="mt-8">
          <PostBirthDashboard child={activeChild} checklistItems={activeChildChecklist} />
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
          {displayResources.length > 0 ? (
            <ResourceFeed resources={displayResources} userTopics={userTopics} />
          ) : (
            <div className="rounded-xl bg-white p-8 text-center shadow-card">
              <p className="text-stone-500">
                No resources found for this age range yet. Check back soon!
              </p>
            </div>
          )}
        </div>

        {isFree && resources.length > 3 && (
          <div className="mt-4">
            <UpgradeBanner feature="the full resource library" />
          </div>
        )}
      </section>

      {/* AI Assistant CTA */}
      <section className="mt-12 rounded-2xl border border-sage-200/60 bg-sage-50 p-6 shadow-card">
        <h3 className="font-semibold text-sage-800">Have a question?</h3>
        <p className="mt-1 text-sm text-sage-600">
          Ask our AI assistant anything about parenting, nutrition, sleep, and
          more. Answers are grounded in our evidence-based resource
          library.
        </p>
        <Link href="/chat" className="mt-4 inline-block rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-accent-600 transition-colors">
          Ask a Question
        </Link>
      </section>
      </div>
    </>
  );
}
