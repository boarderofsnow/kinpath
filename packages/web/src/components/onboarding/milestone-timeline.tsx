"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Flag,
  Baby,
  Eye,
  Ear,
  Heart,
  Star,
} from "lucide-react";

interface Milestone {
  week: number;
  label: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  currentWeek: number;
}

/**
 * A visual timeline showing all 13 pregnancy milestones.
 * Past milestones are checked, current is highlighted, future milestones are dimmed.
 */
export function MilestoneTimeline({
  milestones,
  currentWeek,
}: MilestoneTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  // Show 3 milestones in collapsed view: last completed, current/next, and one future
  const currentIndex = milestones.findIndex((m) => m.week >= currentWeek);
  const visibleStart = Math.max(0, currentIndex - 1);
  const visibleMilestones = expanded
    ? milestones
    : milestones.slice(visibleStart, visibleStart + 3);

  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">
          Pregnancy Milestones
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Show all <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      <div className="relative mt-4">
        {/* Vertical timeline line */}
        <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-stone-100" />

        <div className="space-y-4">
          {visibleMilestones.map((milestone, i) => {
            const isPast = milestone.week < currentWeek;
            const isCurrent =
              milestone.week >= currentWeek &&
              (i === 0 ||
                visibleMilestones[i - 1]?.week < currentWeek ||
                milestone.week === currentWeek);
            const isActive =
              isCurrent &&
              milestones.findIndex((m) => m.week >= currentWeek) ===
                milestones.indexOf(milestone);

            return (
              <div
                key={milestone.week}
                className="relative flex items-start gap-3 pl-0"
              >
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                    isPast
                      ? "bg-brand-100 text-brand-600"
                      : isActive
                        ? "bg-brand-500 text-white ring-4 ring-brand-100"
                        : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {isPast ? (
                    <MilestoneIcon week={milestone.week} className="h-3.5 w-3.5" />
                  ) : isActive ? (
                    <Star className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">
                      {milestone.week}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="pt-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isPast
                          ? "text-brand-600"
                          : isActive
                            ? "text-brand-700"
                            : "text-stone-400"
                      }`}
                    >
                      Week {milestone.week}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                        NOW
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      isPast
                        ? "text-stone-600"
                        : isActive
                          ? "font-medium text-stone-800"
                          : "text-stone-400"
                    }`}
                  >
                    {milestone.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Select a contextual icon for each milestone based on week.
 */
function MilestoneIcon({
  week,
  className,
}: {
  week: number;
  className?: string;
}) {
  if (week <= 12) return <Heart className={className} />;
  if (week <= 20) return <Baby className={className} />;
  if (week <= 24) return <Eye className={className} />;
  if (week <= 28) return <Ear className={className} />;
  if (week <= 36) return <Flag className={className} />;
  return <Star className={className} />;
}
