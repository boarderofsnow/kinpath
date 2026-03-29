"use client";

import Link from "next/link";
import type { ChildWithAge, ChecklistItem, MilestoneAchievement } from "@kinpath/shared";
import { getDevelopmentStage } from "@kinpath/shared";
import { PregnancyDashboard } from "@/components/onboarding/pregnancy-dashboard";
import { PostBirthDashboard } from "@/components/dashboard/post-birth-dashboard";
import { BirthCelebration } from "@/components/dashboard/birth-celebration";
import { SearchBar } from "@/components/search/search-bar";
import { FadeInUp } from "@/components/ui/motion";
import { useChild } from "@/lib/contexts/child-context";
import { useMemo } from "react";

interface DashboardClientProps {
  displayName: string | null;
  enrichedChildren: ChildWithAge[];
  allChecklistItems: ChecklistItem[];
  allAchievements: MilestoneAchievement[];
  userId: string;
}

export function DashboardClient({
  displayName,
  enrichedChildren,
  allChecklistItems,
  allAchievements,
  userId,
}: DashboardClientProps) {
  const { selectedChildId } = useChild();

  const activeChild = useMemo(() => {
    if (selectedChildId === "all" || !selectedChildId) {
      return enrichedChildren[0] ?? null;
    }
    return enrichedChildren.find((c) => c.id === selectedChildId) ?? enrichedChildren[0] ?? null;
  }, [selectedChildId, enrichedChildren]);

  const activeChildChecklist = useMemo(() => {
    if (!activeChild?.is_born) return [];
    return allChecklistItems.filter((item) => {
      if (item.child_ids && item.child_ids.length > 0) {
        return item.child_ids.includes(activeChild.id);
      }
      return item.child_id === activeChild.id;
    });
  }, [activeChild, allChecklistItems]);

  const activeChildAchievements = useMemo(() => {
    if (!activeChild?.is_born) return [];
    return allAchievements.filter((a) => a.child_id === activeChild.id);
  }, [activeChild, allAchievements]);

  const stage = activeChild ? getDevelopmentStage(activeChild.age_in_weeks) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <FadeInUp>
        <header>
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back{displayName ? `, ${displayName}` : ""}
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
        </header>
      </FadeInUp>

      {/* Search bar */}
      <div className="mt-6 max-w-md">
        <SearchBar compact placeholder="Search all resources..." />
      </div>

      {/* Birth celebration banner (shown once via localStorage) */}
      {activeChild?.is_born && (
        <div className="mt-6">
          <BirthCelebration child={activeChild} />
        </div>
      )}

      {/* Pregnancy Dashboard */}
      {activeChild && !activeChild.is_born && (
        <section className="mt-8">
          <PregnancyDashboard child={activeChild} />
        </section>
      )}

      {/* Post-Birth Dashboard */}
      {activeChild?.is_born && (
        <section className="mt-8">
          <PostBirthDashboard child={activeChild} checklistItems={activeChildChecklist} achievements={activeChildAchievements} userId={userId} />
        </section>
      )}

      {/* Browse Resources CTA */}
      <section className="mt-8 rounded-2xl border border-brand-200/60 bg-brand-50 p-6 shadow-card">
        <h3 className="font-semibold text-brand-800">
          Explore Resources{activeChild ? ` for ${activeChild.name}` : ""}
        </h3>
        <p className="mt-1 text-sm text-brand-600">
          Discover age-appropriate, evidence-based resources personalized for your child.
        </p>
        <Link
          href={activeChild ? `/resources?child=${activeChild.id}` : "/resources"}
          prefetch={false}
          className="mt-4 inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Browse Resources
        </Link>
      </section>

      {/* AI Assistant CTA */}
      <section className="mt-12 rounded-2xl border border-sage-200/60 bg-sage-50 p-6 shadow-card">
        <h3 className="font-semibold text-sage-800">Have a question?</h3>
        <p className="mt-1 text-sm text-sage-600">
          Ask our AI assistant anything about parenting, nutrition, sleep, and
          more. Answers are grounded in our evidence-based resource library.
        </p>
        <Link
          href="/chat"
          prefetch={false}
          className="mt-4 inline-block rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-stone-900 transition-colors hover:bg-accent-600"
        >
          Ask a Question
        </Link>
      </section>
    </div>
  );
}
