import {
  DEVELOPMENTAL_MILESTONES,
  type DevelopmentalMilestone,
} from "../constants/development";
import {
  POSTNATAL_WEEKLY_TIPS,
  type PostnatalTip,
} from "../constants/postnatal-tips";

export function getMilestonesForAge(
  ageInWeeks: number
): DevelopmentalMilestone[] {
  return DEVELOPMENTAL_MILESTONES.filter(
    (m) => ageInWeeks >= m.min_weeks && ageInWeeks <= m.max_weeks
  );
}

export function getUpcomingMilestones(
  ageInWeeks: number,
  limit = 5
): DevelopmentalMilestone[] {
  return DEVELOPMENTAL_MILESTONES.filter((m) => m.min_weeks > ageInWeeks)
    .sort((a, b) => a.min_weeks - b.min_weeks)
    .slice(0, limit);
}

export function getPostnatalTip(ageInWeeks: number): PostnatalTip | null {
  return (
    POSTNATAL_WEEKLY_TIPS.find(
      (t) => ageInWeeks >= t.min_weeks && ageInWeeks <= t.max_weeks
    ) ?? null
  );
}

export function getDevelopmentSummary(ageInWeeks: number): {
  current: DevelopmentalMilestone[];
  upcoming: DevelopmentalMilestone[];
  tip: PostnatalTip | null;
} {
  return {
    current: getMilestonesForAge(ageInWeeks),
    upcoming: getUpcomingMilestones(ageInWeeks),
    tip: getPostnatalTip(ageInWeeks),
  };
}
