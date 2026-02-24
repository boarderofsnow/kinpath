import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  }
  return _stripe;
}

/**
 * Resolve a Stripe Price ID to a KinPath subscription tier.
 */
export function resolveTier(priceId: string | undefined): string {
  if (
    priceId === process.env.STRIPE_FAMILY_PRICE_ID ||
    priceId === process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID
  ) {
    return "family";
  }
  return "premium";
}

/**
 * Resolve a plan + interval combination to the configured Stripe Price ID.
 */
export function resolvePriceId(
  plan: "premium" | "family",
  interval: "monthly" | "annual"
): string | undefined {
  if (interval === "annual") {
    return plan === "premium"
      ? process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
      : process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID;
  }
  return plan === "premium"
    ? process.env.STRIPE_PREMIUM_PRICE_ID
    : process.env.STRIPE_FAMILY_PRICE_ID;
}
