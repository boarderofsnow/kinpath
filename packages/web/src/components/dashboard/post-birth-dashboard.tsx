"use client";

import Link from "next/link";
import type { ChildWithAge, ChecklistItem } from "@kinpath/shared";
import {
  getDevelopmentStage,
  getMilestonesForAge,
  getUpcomingMilestones,
  getPostnatalTip,
  DOMAIN_LABELS,
} from "@kinpath/shared";
import type { DevelopmentalMilestone } from "@kinpath/shared";
import {
  Sparkles,
  Heart,
  Baby,
  Calendar,
  ArrowRight,
  Brain,
  MessageCircle,
  Hand,
  Users,
} from "lucide-react";

interface PostBirthDashboardProps {
  child: ChildWithAge;
  checklistItems: ChecklistItem[];
}

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  motor: <Hand className="h-3.5 w-3.5" />,
  language: <MessageCircle className="h-3.5 w-3.5" />,
  cognitive: <Brain className="h-3.5 w-3.5" />,
  social: <Users className="h-3.5 w-3.5" />,
};

const DOMAIN_COLORS: Record<string, string> = {
  motor: "bg-blue-100 text-blue-600",
  language: "bg-violet-100 text-violet-600",
  cognitive: "bg-amber-100 text-amber-700",
  social: "bg-rose-100 text-rose-600",
};

function getAgeFunFact(ageInWeeks: number): string {
  if (ageInWeeks < 4) return "Newborns can recognize their mother's voice from birth!";
  if (ageInWeeks < 8) return "Babies this age can see about 8-12 inches — just far enough to see your face while feeding.";
  if (ageInWeeks < 13) return "Smiling is one of the first ways babies communicate socially.";
  if (ageInWeeks < 20) return "At this age, babies begin to discover cause and effect — shake a rattle, it makes noise!";
  if (ageInWeeks < 30) return "Babies now understand object permanence — things still exist when hidden!";
  if (ageInWeeks < 44) return "Crawling comes in many forms — scooting, rolling, army-crawling. They're all normal!";
  if (ageInWeeks < 65) return "Toddlers learn about 1-2 new words every day, even if they can't say them all yet.";
  if (ageInWeeks < 105) return "Children this age are wired to explore. Every mess is a science experiment!";
  if (ageInWeeks < 157) return "Preschoolers ask an average of 300 questions a day. Curiosity is a superpower!";
  return "Your child is building the foundation for lifelong learning. Every conversation matters.";
}

export function PostBirthDashboard({ child, checklistItems }: PostBirthDashboardProps) {
  const ageWeeks = child.age_in_weeks;
  const stage = getDevelopmentStage(ageWeeks);
  const currentMilestones = getMilestonesForAge(ageWeeks);
  const upcomingMilestones = getUpcomingMilestones(ageWeeks, 3);
  const tip = getPostnatalTip(ageWeeks);

  // Upcoming checklist items (not completed, sorted by date)
  const upcomingChecklist = checklistItems
    .filter((item) => !item.is_completed && (item.due_date || item.suggested_date))
    .sort((a, b) => {
      const dateA = a.due_date ?? a.suggested_date ?? "";
      const dateB = b.due_date ?? b.suggested_date ?? "";
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Group milestones by domain
  const milestonesByDomain = currentMilestones.reduce<
    Record<string, DevelopmentalMilestone[]>
  >((acc, m) => {
    (acc[m.domain] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Hero: Age + Stage + Fun Fact */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-sage-50 p-6 shadow-card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100">
              <Baby className="h-12 w-12 text-brand-500" />
            </div>
            <p className="mt-2 text-sm font-semibold text-stone-900">
              {child.name}
            </p>
            <p className="text-xs text-stone-500">{child.age_label}</p>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-medium uppercase tracking-wide text-brand-500">
              {stage}
            </div>
            <div className="mt-1 text-3xl font-bold text-stone-900">
              {child.age_label}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentMilestones.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700">
                  <Brain className="h-3 w-3" />
                  {currentMilestones.length} active milestone{currentMilestones.length !== 1 ? "s" : ""}
                </span>
              )}
              {upcomingChecklist.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                  <Calendar className="h-3 w-3" />
                  {upcomingChecklist.length} coming up
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-white/70 p-4 text-center">
          <p className="text-sm italic text-stone-700">
            &ldquo;{getAgeFunFact(ageWeeks)}&rdquo;
          </p>
        </div>
      </div>

      {/* This Week for You */}
      {tip && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-stone-900">
              This Week for You
            </h3>
          </div>
          <p className="mt-2 text-sm text-stone-700">{tip.body}</p>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-sage-50 p-3">
            <Heart className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-sage-500" />
            <p className="text-xs text-sage-700">{tip.self_care}</p>
          </div>
        </div>
      )}

      {/* Developmental Milestones */}
      {currentMilestones.length > 0 && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-stone-900">
            Developmental Milestones
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            These are typical milestones for {child.name}&apos;s age. Every child develops at their own pace.
          </p>

          <div className="mt-4 space-y-4">
            {Object.entries(milestonesByDomain).map(([domain, milestones]) => (
              <div key={domain}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${DOMAIN_COLORS[domain]}`}>
                    {DOMAIN_ICONS[domain]}
                  </div>
                  <span className="text-xs font-semibold text-stone-700">
                    {DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]}
                  </span>
                </div>
                <div className="mt-2 ml-8 space-y-2">
                  {milestones.map((m) => (
                    <div key={m.id} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-300" />
                      <div>
                        <p className="text-sm text-stone-800">{m.title}</p>
                        <p className="text-xs text-stone-500">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming milestones preview */}
          {upcomingMilestones.length > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-xs font-medium text-stone-500">Coming next</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {upcomingMilestones.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600"
                  >
                    {m.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coming Up — next checklist items */}
      {upcomingChecklist.length > 0 && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">Coming Up</h3>
            <Link
              href="/plan"
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {upcomingChecklist.map((item) => {
              const displayDate = item.due_date ?? item.suggested_date;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-stone-800">{item.title}</p>
                    {displayDate && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        {new Date(displayDate + "T00:00:00").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
