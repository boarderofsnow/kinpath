export interface ChecklistItem {
  id: string;
  child_id: string;
  user_id: string;
  title: string;
  description: string | null;
  item_type: "milestone" | "custom";
  milestone_key: string | null;
  suggested_date: string | null; // ISO date
  due_date: string | null; // ISO date, editable by parent
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MilestoneTemplate {
  key: string;
  title: string;
  description: string;
  category: "pregnancy" | "postpartum" | "development";
  offset_weeks: number; // relative to due_date (negative = before) or birth (positive = after)
  offset_reference: "due_date" | "birth";
  icon: string; // lucide icon name
}
