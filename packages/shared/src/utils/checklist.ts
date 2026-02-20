import type { Child } from "../types/child";
import type { ChecklistItem, MilestoneTemplate } from "../types/checklist";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Calculate the actual calendar date for a milestone based on a child's dates.
 */
export function calculateMilestoneDate(
  child: Child,
  template: MilestoneTemplate
): Date | null {
  if (template.offset_reference === "due_date") {
    const ref = child.due_date ?? child.dob;
    if (!ref) return null;
    const refDate = new Date(ref);
    return new Date(refDate.getTime() + template.offset_weeks * 7 * MS_PER_DAY);
  }

  // offset_reference === "birth"
  const ref = child.dob ?? child.due_date;
  if (!ref) return null;
  const refDate = new Date(ref);
  return new Date(refDate.getTime() + template.offset_weeks * 7 * MS_PER_DAY);
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD).
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Filter milestone templates to those relevant for a child's current stage,
 * excluding any that have already been added (by milestone_key).
 */
export function getRelevantMilestones(
  child: Child,
  templates: MilestoneTemplate[],
  existingKeys: Set<string>
): MilestoneTemplate[] {
  const now = new Date();

  return templates.filter((t) => {
    // Skip already-added milestones
    if (existingKeys.has(t.key)) return false;

    // Calculate date
    const date = calculateMilestoneDate(child, t);
    if (!date) return false;

    // Show milestones up to 6 months in the future and any past ones not yet added
    const sixMonthsFromNow = new Date(now.getTime() + 26 * 7 * MS_PER_DAY);
    return date <= sixMonthsFromNow;
  });
}

export interface GroupedItems {
  overdue: ChecklistItem[];
  thisMonth: ChecklistItem[];
  comingUp: ChecklistItem[];
  completed: ChecklistItem[];
}

/**
 * Group checklist items into time-based categories.
 */
export function groupByTimeframe(items: ChecklistItem[]): GroupedItems {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const overdue: ChecklistItem[] = [];
  const thisMonth: ChecklistItem[] = [];
  const comingUp: ChecklistItem[] = [];
  const completed: ChecklistItem[] = [];

  for (const item of items) {
    if (item.is_completed) {
      completed.push(item);
      continue;
    }

    const dueDate = item.due_date ?? item.suggested_date;
    if (!dueDate) {
      comingUp.push(item);
      continue;
    }

    const date = new Date(dueDate);

    if (date < today) {
      overdue.push(item);
    } else if (date <= endOfMonth) {
      thisMonth.push(item);
    } else {
      comingUp.push(item);
    }
  }

  // Sort each group by date
  const sortByDate = (a: ChecklistItem, b: ChecklistItem) => {
    const dateA = a.due_date ?? a.suggested_date ?? "";
    const dateB = b.due_date ?? b.suggested_date ?? "";
    return dateA.localeCompare(dateB);
  };

  overdue.sort(sortByDate);
  thisMonth.sort(sortByDate);
  comingUp.sort(sortByDate);
  completed.sort(
    (a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")
  );

  return { overdue, thisMonth, comingUp, completed };
}
