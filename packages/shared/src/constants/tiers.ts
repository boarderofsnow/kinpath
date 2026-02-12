import type { SubscriptionTier, TierLimits } from "../types/subscription";

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    ai_questions_per_month: 5,
    max_children: 1,
    full_library_access: false,
    bookmarks_enabled: false,
    email_digests_enabled: false,
    partner_invite_enabled: false,
    printable_checklists: false,
  },
  premium: {
    ai_questions_per_month: null, // unlimited
    max_children: 5,
    full_library_access: true,
    bookmarks_enabled: true,
    email_digests_enabled: true,
    partner_invite_enabled: false,
    printable_checklists: true,
  },
  family: {
    ai_questions_per_month: null, // unlimited
    max_children: 5,
    full_library_access: true,
    bookmarks_enabled: true,
    email_digests_enabled: true,
    partner_invite_enabled: true,
    printable_checklists: true,
  },
};

export const TIER_PRICING = {
  premium: {
    monthly: 9.99,
    annual: 79.99,
    currency: "usd",
  },
  family: {
    monthly: 14.99,
    annual: 99.99,
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
