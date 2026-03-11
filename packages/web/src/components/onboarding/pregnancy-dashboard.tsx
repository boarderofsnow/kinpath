"use client";

import type { ChildWithAge } from "@kinpath/shared";
import {
  getDueDateCountdown,
  getBabySizeComparison,
  getPlanningTips,
  getMaternalChanges,
  getAllMilestones,
} from "@kinpath/shared";
import {
  Calendar,
  Heart,
  Moon,
  Users,
  ClipboardList,
  ShoppingBag,
  Activity,
  Search,
  Gift,
  BookOpen,
  CheckCircle,
  Briefcase,
  UtensilsCrossed,
  Sun,
  Clock,
  Home,
  Car,
  FileText,
  Megaphone,
  Pill,
  Scan,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { MilestoneTimeline } from "./milestone-timeline";

interface PregnancyDashboardProps {
  child: ChildWithAge;
}

/** Map planning tip icon names → Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  calendar: Calendar,
  pill: Pill,
  heart: Heart,
  moon: Moon,
  users: Users,
  clipboard: ClipboardList,
  megaphone: Megaphone,
  "shopping-bag": ShoppingBag,
  activity: Activity,
  search: Search,
  scan: Scan,
  gift: Gift,
  book: BookOpen,
  "file-text": FileText,
  home: Home,
  car: Car,
  "check-circle": CheckCircle,
  briefcase: Briefcase,
  utensils: UtensilsCrossed,
  sun: Sun,
  clock: Clock,
};

const CATEGORY_COLORS: Record<string, string> = {
  health: "bg-brand-100 text-brand-600",
  preparation: "bg-amber-100 text-amber-700",
  shopping: "bg-violet-100 text-violet-600",
  social: "bg-sky-100 text-sky-600",
  self_care: "bg-rose-100 text-rose-600",
};

/**
 * A rich, engaging dashboard for expecting parents.
 * Shows baby size, countdown, body changes, milestone timeline, and planning tips.
 */
export function PregnancyDashboard({ child }: PregnancyDashboardProps) {
  const countdown = getDueDateCountdown(child);
  if (!countdown) return null;

  const sizeComparison = getBabySizeComparison(countdown.gestationalWeek);
  const planningTips = getPlanningTips(countdown.gestationalWeek, 3);
  const maternalChanges = getMaternalChanges(countdown.gestationalWeek);
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
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
          {/* Baby size illustration */}
          {sizeComparison && (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-4xl">
                {sizeComparison.emoji}
              </div>
              <p className="mt-2 text-sm font-semibold text-brand-900">
                Baby is the size of a {sizeComparison.object}
              </p>
              <p className="text-xs text-brand-300">
                ~{sizeComparison.lengthCm}cm &middot;{" "}
                {sizeComparison.weightDescription}
              </p>
            </div>
          )}

          {/* Countdown */}
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              {trimesterLabel} &middot; Week {countdown.gestationalWeek}
            </div>
            <div className="mt-1 font-display text-3xl font-bold text-brand-900">
              {countdown.weeksRemaining > 0 ? (
                <>
                  {countdown.weeksRemaining}{" "}
                  <span className="text-lg font-normal text-brand-300">
                    week{countdown.weeksRemaining !== 1 ? "s" : ""}
                  </span>
                  {countdown.daysRemainder > 0 && (
                    <>
                      {" "}
                      {countdown.daysRemainder}{" "}
                      <span className="text-lg font-normal text-brand-300">
                        day{countdown.daysRemainder !== 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                  <span className="text-lg font-normal text-brand-300">
                    {" "}
                    to go
                  </span>
                </>
              ) : (
                <span className="text-brand-500">Any day now!</span>
              )}
            </div>
            <div className="mt-2 h-[2px] w-10 rounded-full bg-brand-400" />

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-brand-300">
                <span>Conception</span>
                <span>{countdown.percentComplete}%</span>
                <span>Due Date</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-brand-100">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-500"
                  style={{ width: `${countdown.percentComplete}%` }}
                />
              </div>
            </div>

            {/* Milestone */}
            {countdown.milestone && (
              <p className="mt-2 text-xs font-medium text-brand-400">
                {countdown.milestone}
              </p>
            )}
          </div>
        </div>

        {/* Weekly encouragement — info box style */}
        <div className="mx-6 mb-6 rounded-xl border border-brand-200 bg-sage-50 p-4 text-center">
          <p className="text-sm italic text-[#4A5E52]">
            &ldquo;{countdown.encouragement}&rdquo;
          </p>
        </div>
      </div>

      {/* This Week For You — maternal body changes */}
      {maternalChanges && (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-brand-900">
              This Week for You
            </h3>
          </div>
          <div className="mt-1.5 h-[2px] w-8 rounded-full bg-brand-400" />
          <p className="mt-3 text-sm leading-relaxed text-[#4A5E52]">{maternalChanges.body}</p>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-200 bg-sage-50 p-3">
            <Heart className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-400" />
            <p className="text-xs text-[#4A5E52]">{maternalChanges.tip}</p>
          </div>
        </div>
      )}

      {/* Milestone Timeline */}
      <MilestoneTimeline
        milestones={allMilestones}
        currentWeek={countdown.gestationalWeek}
      />

      {/* Planning Tips */}
      {planningTips.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <h3 className="text-sm font-semibold text-brand-900">Coming Up</h3>
          <div className="mt-1.5 h-[2px] w-8 rounded-full bg-brand-400" />
          <div className="mt-4 space-y-3">
            {planningTips.map((tip, i) => {
              const IconComponent = ICON_MAP[tip.icon] ?? Calendar;
              const colorClasses =
                CATEGORY_COLORS[tip.category] ?? "bg-brand-100 text-brand-500";
              const isCurrentWeek = tip.week === countdown.gestationalWeek;

              return (
                <div
                  key={`${tip.week}-${i}`}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      isCurrentWeek ? "bg-brand-100 text-brand-500" : colorClasses
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-brand-900">{tip.tip}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-brand-300">
                        Week {tip.week}
                      </span>
                      <span className="text-brand-200">&middot;</span>
                      <span className="text-xs capitalize text-brand-300">
                        {tip.category.replace("_", " ")}
                      </span>
                    </div>
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
