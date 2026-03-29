export interface MilestoneAchievement {
  id: string;
  child_id: string;
  user_id: string;
  milestone_id: string; // matches DevelopmentalMilestone.id
  achieved_date: string; // ISO date string
  notes: string | null;
  created_at: string;
  updated_at: string;
}
