"use client";

import Link from "next/link";
import type { ChildWithAge, ChecklistItem } from "@kinpath/shared";
import {
  getDueDateCountdown,
  getBabySizeComparison,
  getMaternalChanges,
  getAllMilestones,
} from "@kinpath/shared";
import {
  Heart,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { MilestoneTimeline } from "./milestone-timeline";

interface PregnancyDashboardProps {
  child: ChildWithAge;
  checklistItems: ChecklistItem[];
}

/**
 * A rich, engaging dashboard for expecting parents.
 * Shows baby size, countdown, body changes, milestone timeline, and planning tips.
 */
export function PregnancyDashboard({ child, checklistItems }: PregnancyDashboardProps) {
  const countdown = getDueDateCountdown(child);
  if (!countdown) return null;

  const sizeComparison = getBabySizeComparison(countdown.gestationalWeek);
  const maternalChanges = getMaternalChanges(countdown.gestationalWeek);

  const upcomingItems = checklistItems
    .filter((item) => !item.is_completed && item.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);
  const allMilestones = getAllMilestones();

  const trimesterLabel =
    countdown.trimester === 1
      ? "First Trimester"
      : countdown.trimester === 2
        ? "Second Trimester"
        : "Third Trimester";

  return (
    <div className="space-y-6">
      {/* Hero: Baby size + countdown */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-sage-50 p-6 shadow-card">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Baby size illustration */}
          {sizeComparison && (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-5xl">
                {sizeComparison.emoji}
              </div>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                Baby is the size of a {sizeComparison.object}
              </p>
              <p className="text-xs text-stone-500">
                ~{sizeComparison.lengthCm}cm &middot;{" "}
                {sizeComparison.weightDescription}
              </p>
            </div>
          )}

          {/* Countdown */}
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-medium uppercase tracking-wide text-brand-500">
              {trimesterLabel} &middot; Week {countdown.gestationalWeek}
            </div>
            <div className="mt-1 text-3xl font-bold text-stone-900">
              {countdown.weeksRemaining > 0 ? (
                <>
                  {countdown.weeksRemaining}{" "}
                  <span className="text-lg font-normal text-stone-500">
                    week{countdown.weeksRemaining !== 1 ? "s" : ""}
                  </span>
                  {countdown.daysRemainder > 0 && (
                    <>
                      {" "}
                      {countdown.daysRemainder}{" "}
                      <span className="text-lg font-normal text-stone-500">
                        day{countdown.daysRemainder !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                  <span className="text-lg font-normal text-stone-500">
                    {" "}
                    to go
                  </span>
                </>
              ) : (
                <span className="text-brand-500">Any day now!</span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-stone-400">
                <span>Conception</span>
                <span>{countdown.percentComplete}%</span>
                <span>Due Date</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-stone-200">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                  style={{ width: `${countdown.percentComplete}%` }}
                />
              </div>
            </div>

            {/* Milestone */}
            {countdown.milestone && (
              <p className="mt-2 text-xs font-medium text-sage-600">
                {countdown.milestone}
              </p>
            )}
          </div>
        </div>

        {/* Weekly encouragement */}
        <div className="mt-5 rounded-xl bg-white/70 p-4 text-center">
          <p className="text-sm italic text-stone-700">
            &ldquo;{countdown.encouragement}&rdquo;
          </p>
        </div>
      </div>

      {/* This Week For You — maternal body changes */}
      {maternalChanges && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-stone-900">
              This Week for You
            </h3>
          </div>
          <p className="mt-2 text-sm text-stone-700">{maternalChanges.body}</p>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-sage-50 p-3">
            <Heart className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-sage-500" />
            <p className="text-xs text-sage-700">{maternalChanges.tip}</p>
          </div>
        </div>
      )}

      {/* Milestone Timeline */}
      <MilestoneTimeline
        milestones={allMilestones}
        currentWeek={countdown.gestationalWeek}
      />

      {/* Coming Up — from user's checklist items */}
      <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
        <h3 className="text-sm font-semibold text-stone-900">Coming Up</h3>
        {upcomingItems.length > 0 ? (
          <div className="mt-3 space-y-3">
            {upcomingItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <ClipboardList className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-stone-800">{item.title}</p>
                  {item.due_date && (
                    <p className="mt-0.5 text-xs text-stone-400">
                      {new Date(item.due_date + "T00:00:00").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <Link
              href="/plan"
              className="mt-2 inline-block text-xs font-medium text-brand-500 hover:text-brand-600"
            >
              View all in Plan &rarr;
            </Link>
          </div>
        ) : (
          <div className="mt-3 text-center">
            <p className="text-sm text-stone-500">
              Add items from your{" "}
              <Link href="/plan" className="font-medium text-brand-500 hover:text-brand-600">
                Plan
              </Link>{" "}
              to see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
