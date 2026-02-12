export type SubscriptionTier = "free" | "premium" | "family";

export interface TierLimits {
  ai_questions_per_month: number | null; // null = unlimited
  max_children: number;
  full_library_access: boolean;
  bookmarks_enabled: boolean;
  email_digests_enabled: boolean;
  partner_invite_enabled: boolean;
  printable_checklists: boolean;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  is_active: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: "stripe" | "app_store" | null; // Where the subscription originated
}
