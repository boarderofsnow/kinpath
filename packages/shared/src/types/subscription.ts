export type SubscriptionTier = "free" | "premium" | "family";

export interface TierLimits {
  ai_questions_per_month: number | null; // null = unlimited
  max_children: number | null; // null = unlimited
  full_library_access: boolean;
  child_filter_enabled: boolean;
  bookmarks_enabled: boolean;
  email_digests_enabled: boolean;
  partner_invite_enabled: boolean;
  max_household_members: number; // 0 = none, 1 = premium (partner), 5 = family
  printable_checklists: boolean;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  is_active: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: "stripe" | "app_store" | null; // Where the subscription originated
}
