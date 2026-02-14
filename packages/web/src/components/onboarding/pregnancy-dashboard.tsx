"use client";

import type { ChildWithAge } from "@kinpath/shared";
import {
  getDueDateCountdown,
  getBabySizeComparison,
  getPlanningTips,
} from "@kinpath/shared";

interface PregnancyDashboardProps {
  child: ChildWithAge;
}

/**
 * A rich, engaging dashboard for expecting parents.
 * Shows baby size comparison, due date countdown, encouragement, and planning tips.
 */
export function PregnancyDashboard({ child }: PregnancyDashboardProps) {
  const countdown = getDueDateCountdown(child);
  if (!countdown) return null;

  const sizeComparison = getBabySizeComparison(countdown.gestationalWeek);
  const planningTips = getPlanningTips(countdown.gestationalWeek, 3);

  const trimesterLabel =
    countdown.trimester === 1
      ? "First Trimester"
      : countdown.trimester === 2
        ? "Second Trimester"
        : "Third Trimester";

  return (
    <div className="space-y-6">
      {/* Hero: Baby size + countdown */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-sage-50 p-6 shadow-sm">
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
                ~{sizeComparison.lengthCm}cm &middot; {sizeComparison.weightDescription}
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
                  <span className="text-lg font-normal text-stone-500"> to go</span>
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

      {/* Planning Tips */}
      {planningTips.length > 0 && (
        <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-900">
            Coming Up
          </h3>
          <div className="mt-3 space-y-3">
            {planningTips.map((tip, i) => (
              <div
                key={`${tip.week}-${i}`}
                className="flex items-start gap-3"
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    tip.week === countdown.gestationalWeek
                      ? "bg-brand-100 text-brand-600"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {tip.week}
                </div>
                <div>
                  <p className="text-sm text-stone-800">{tip.tip}</p>
                  <span className="text-xs capitalize text-stone-400">
                    {tip.category.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
