export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string | null;
  invited_email: string;
  display_name: string | null;
  role: "owner" | "partner";
  status: "pending" | "accepted" | "declined";
  invited_at: string;
  accepted_at: string | null;
}
