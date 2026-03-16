import { Router, Request, Response } from "express";
import { createServiceRoleClient } from "../lib/supabase";
import { getStripe, resolveTier } from "../lib/stripe";
import { TIER_LIMITS, type SubscriptionTier } from "@kinpath/shared";
import Stripe from "stripe";

export const webhooksRouter = Router();

// ─── Shared helpers ──────────────────────────────────────────────────────────

/**
 * Sync household max_members and evict excess members when the owner's tier
 * changes. Mirrors the same function in the web Stripe webhook.
 */
async function syncHousehold(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  newTier: SubscriptionTier
) {
  const maxMembers = TIER_LIMITS[newTier].max_household_members;

  const { data: household } = await supabase
    .from("households")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (!household) return;

  await supabase
    .from("households")
    .update({ max_members: maxMembers })
    .eq("id", household.id);

  if (maxMembers === 0) {
    // Free tier: revoke all members
    const { data: members } = await supabase
      .from("household_members")
      .select("id, user_id")
      .eq("household_id", household.id)
      .neq("status", "declined");

    for (const member of members ?? []) {
      await supabase
        .from("household_members")
        .update({ status: "declined" })
        .eq("id", member.id);

      if (member.user_id) {
        await supabase
          .from("users")
          .update({ subscription_tier: "free" })
          .eq("id", member.user_id);
      }
    }
  } else {
    // Check if current member count exceeds the new limit
    const { data: activeMembers } = await supabase
      .from("household_members")
      .select("id, user_id")
      .eq("household_id", household.id)
      .neq("status", "declined")
      .order("invited_at", { ascending: true });

    if (activeMembers && activeMembers.length > maxMembers) {
      const excessMembers = activeMembers.slice(maxMembers);
      for (const member of excessMembers) {
        await supabase
          .from("household_members")
          .update({ status: "declined" })
          .eq("id", member.id);

        if (member.user_id) {
          await supabase
            .from("users")
            .update({ subscription_tier: "free" })
            .eq("id", member.user_id);
        }
      }
    }
  }
}

// ─── Stripe webhook ──────────────────────────────────────────────────────────

// POST /webhooks/stripe
// NOTE: Requires the raw request body for signature verification.
// In index.ts, express.raw({ type: 'application/json' }) is applied specifically
// to /webhooks/stripe BEFORE the global express.json() middleware.
webhooksRouter.post("/stripe", async (req: Request, res: Response) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const tier = resolveTier(priceId) as SubscriptionTier;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabase
            .from("users")
            .update({ subscription_tier: tier, stripe_customer_id: customerId })
            .eq("id", userId);
          await syncHousehold(supabase, userId, tier);
        } else {
          const { data: user } = await supabase
            .from("users")
            .update({ subscription_tier: tier, stripe_customer_id: customerId })
            .eq("stripe_customer_id", customerId)
            .select("id")
            .single();
          if (user) await syncHousehold(supabase, user.id, tier);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (subscription.status === "active") {
          const priceId = subscription.items.data[0]?.price.id;
          const tier = resolveTier(priceId) as SubscriptionTier;
          const { data: user } = await supabase
            .from("users")
            .update({ subscription_tier: tier })
            .eq("stripe_customer_id", customerId)
            .select("id")
            .single();
          if (user) await syncHousehold(supabase, user.id, tier);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const { data: user } = await supabase
          .from("users")
          .update({ subscription_tier: "free" })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .single();
        if (user) await syncHousehold(supabase, user.id, "free");
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err);
    // Return 200 anyway — Stripe retrying won't fix a DB error
  }

  res.json({ received: true });
});

// ─── RevenueCat webhook ──────────────────────────────────────────────────────

/**
 * Resolve a RevenueCat subscriber's active entitlements to a Kinpath tier.
 *
 * Entitlement priority:
 *   "Kinpath Family"  → "family"
 *   "Kinpath Pro"     → "premium"  (all 4 products grant this)
 *   (neither)         → "free"
 */
function resolveRcTier(
  entitlements: Record<string, unknown>
): SubscriptionTier {
  if ("Kinpath Family" in entitlements) return "family";
  if ("Kinpath Pro" in entitlements) return "premium";
  return "free";
}

// Events that mean the subscription is active / tier may have changed
const RC_ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "TRANSFER",
]);

// Events that mean the subscription has definitively ended
const RC_EXPIRED_EVENTS = new Set(["EXPIRATION", "BILLING_ISSUE"]);

// POST /webhooks/revenuecat
webhooksRouter.post("/revenuecat", async (req: Request, res: Response) => {
  // ── Auth: shared secret ────────────────────────────────────────────────────
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("REVENUECAT_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${webhookSecret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  const { event } = req.body as {
    event: {
      type: string;
      app_user_id: string;
      aliases?: string[];
      subscriber_attributes?: Record<string, unknown>;
      entitlements?: Record<string, unknown>;
    };
  };

  if (!event?.type || !event?.app_user_id) {
    res.status(400).json({ error: "Missing event.type or event.app_user_id" });
    return;
  }

  // app_user_id is the Supabase user UUID set via Purchases.logIn(userId)
  const userId = event.app_user_id;
  const supabase = createServiceRoleClient();

  try {
    if (RC_ACTIVE_EVENTS.has(event.type)) {
      // ── Active subscription ──────────────────────────────────────────────
      const tier = resolveRcTier(event.entitlements ?? {});

      const { data: user } = await supabase
        .from("users")
        .update({
          subscription_tier: tier,
          rc_customer_id: userId, // idempotent — already set after first purchase
        })
        .eq("id", userId)
        .select("id")
        .single();

      if (user) {
        await syncHousehold(supabase, user.id, tier);
      } else {
        console.warn(`[RC webhook] No user found for app_user_id: ${userId}`);
      }
    } else if (RC_EXPIRED_EVENTS.has(event.type)) {
      // ── Subscription ended ───────────────────────────────────────────────
      const { data: user } = await supabase
        .from("users")
        .update({ subscription_tier: "free" })
        .eq("id", userId)
        .select("id")
        .single();

      if (user) {
        await syncHousehold(supabase, user.id, "free");
      }
    }
    // CANCELLATION is intentionally ignored: the sub is still active until
    // period end, at which point RC fires EXPIRATION.
  } catch (err) {
    console.error(`[RC webhook] Error handling ${event.type}:`, err);
    // Return 200 — RC will retry on non-2xx, but a DB error won't self-heal
  }

  res.json({ received: true });
});
