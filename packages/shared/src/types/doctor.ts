export interface DoctorDiscussionItem {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  priority: "low" | "normal" | "high";
  is_discussed: boolean;
  discussed_at: string | null;
  doctor_response: string | null;
  conversation_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  child_ids?: string[];
}
