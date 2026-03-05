import type { SubscriptionTier, TierLimits } from "../types/subscription";

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    ai_questions_per_month: 5,
    max_children: 1,
    full_library_access: true,
    child_filter_enabled: false,
    bookmarks_enabled: false,
    email_digests_enabled: false,
    partner_invite_enabled: false,
    max_household_members: 0,
    printable_checklists: false,
  },
  premium: {
    ai_questions_per_month: null, // unlimited
    max_children: null, // unlimited
    full_library_access: true,
    child_filter_enabled: true,
    bookmarks_enabled: true,
    email_digests_enabled: true,
    partner_invite_enabled: true,
    max_household_members: 1, // 1 partner
    printable_checklists: true,
  },
  family: {
    ai_questions_per_month: null, // unlimited
    max_children: null, // unlimited
    full_library_access: true,
    child_filter_enabled: true,
    bookmarks_enabled: true,
    email_digests_enabled: true,
    partner_invite_enabled: true,
    max_household_members: 5, // up to 5 additional users
    printable_checklists: true,
  },
};

export const TIER_PRICING = {
  premium: {
    monthly: 12.99,
    annual: 99.99,
    currency: "usd",
  },
  family: {
    monthly: 19.99,
    annual: 149.99,
    currency: "usd",
  },
} as const;

/**
 * Check if a user's tier grants access to a given feature.
 */
export function hasFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  const limits = TIER_LIMITS[tier];
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return value === null; // null means unlimited
}
