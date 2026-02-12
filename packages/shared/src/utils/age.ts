import type { Child, ChildWithAge } from "../types/child";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const FULL_TERM_WEEKS = 40;

/**
 * Calculate a child's age in weeks.
 * Negative values = prenatal (e.g., -10 means 30 weeks gestational)
 * Zero = birth week
 * Positive = postnatal weeks
 */
export function calculateAgeInWeeks(child: Child, now: Date = new Date()): number {
  if (child.is_born && child.dob) {
    const dob = new Date(child.dob);
    return Math.floor((now.getTime() - dob.getTime()) / MS_PER_WEEK);
  }

  if (child.due_date) {
    const dueDate = new Date(child.due_date);
    const weeksUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / MS_PER_WEEK
    );
    // Gestational age as negative weeks: -40 = conception, 0 = due date
    return -(Math.max(0, Math.min(weeksUntilDue, FULL_TERM_WEEKS)));
  }

  return 0;
}

/**
 * Generate a human-readable age label.
 */
export function formatAgeLabel(ageInWeeks: number): string {
  if (ageInWeeks < 0) {
    const gestationalWeeks = FULL_TERM_WEEKS + ageInWeeks;
    return `${gestationalWeeks} weeks pregnant`;
  }

  if (ageInWeeks === 0) return "Newborn";

  if (ageInWeeks < 4) {
    return `${ageInWeeks} week${ageInWeeks === 1 ? "" : "s"} old`;
  }

  const months = Math.floor(ageInWeeks / 4.345); // Average weeks per month
  if (months < 24) {
    return `${months} month${months === 1 ? "" : "s"} old`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} year${years === 1 ? "" : "s"} old`;
  }
  return `${years} year${years === 1 ? "" : "s"}, ${remainingMonths} month${remainingMonths === 1 ? "" : "s"} old`;
}

/**
 * Enrich a Child with calculated age data.
 */
export function enrichChildWithAge(child: Child, now?: Date): ChildWithAge {
  const ageInWeeks = calculateAgeInWeeks(child, now);
  return {
    ...child,
    age_in_weeks: ageInWeeks,
    age_label: formatAgeLabel(ageInWeeks),
  };
}

/**
 * Get the current development stage label for a given age.
 */
export function getDevelopmentStage(ageInWeeks: number): string {
  if (ageInWeeks < -26) return "First Trimester";
  if (ageInWeeks < -12) return "Second Trimester";
  if (ageInWeeks < 0) return "Third Trimester";
  if (ageInWeeks < 4) return "Newborn";
  if (ageInWeeks < 12) return "Early Infancy";
  if (ageInWeeks < 26) return "Infancy";
  if (ageInWeeks < 52) return "Late Infancy";
  if (ageInWeeks < 104) return "Toddler";
  if (ageInWeeks < 156) return "Early Preschool";
  return "Preschool";
}
