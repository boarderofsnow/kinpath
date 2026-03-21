import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient, createServiceRoleClient } from "../lib/supabase";
import { getStripe } from "../lib/stripe";
import type { SubscriptionTier } from "@kinpath/shared";

export const accountRouter = Router();

// ─── RevenueCat tier resolution (mirrors webhooks.ts) ────────────────────────

function resolveRcTierFromEntitlements(
  entitlements: Record<string, unknown>
): SubscriptionTier {
  if ("Kinpath Family" in entitlements) return "family";
  if ("Kinpath Pro" in entitlements) return "premium";
  return "free";
}

// POST /account/sync-subscription
// Called by the mobile app when RevenueCat reports an active entitlement but
// Supabase is out of sync (common in Apple sandbox where subs renew rapidly).
accountRouter.post(
  "/sync-subscription",
  requireAuth,
  async (req, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const rcApiKey = process.env.REVENUECAT_API_KEY;

    if (!rcApiKey) {
      console.error("REVENUECAT_API_KEY is not set");
      res.status(500).json({ error: "RevenueCat API key not configured" });
      return;
    }

    try {
      // Fetch the subscriber's current state from RevenueCat's REST API
      const rcRes = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${rcApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!rcRes.ok) {
        console.error(
          `[sync-subscription] RevenueCat API returned ${rcRes.status}`
        );
        res.status(502).json({ error: "Failed to fetch RevenueCat subscriber" });
        return;
      }

      const rcData = (await rcRes.json()) as {
        subscriber?: {
          entitlements?: Record<
            string,
            { expires_date: string | null; product_identifier: string }
          >;
        };
      };

      // Build a map of currently active entitlements
      const now = Date.now();
      const activeEntitlements: Record<string, unknown> = {};
      for (const [name, ent] of Object.entries(
        rcData.subscriber?.entitlements ?? {}
      )) {
        // No expiry = lifetime; future expiry = still active
        if (!ent.expires_date || new Date(ent.expires_date).getTime() > now) {
          activeEntitlements[name] = ent;
        }
      }

      const tier = resolveRcTierFromEntitlements(activeEntitlements);

      const supabase = createServiceRoleClient();
      const { error: updateError } = await supabase
        .from("users")
        .update({ subscription_tier: tier, rc_customer_id: userId })
        .eq("id", userId);

      if (updateError) {
        console.error("[sync-subscription] Supabase update failed:", updateError);
        res.status(500).json({ error: "Failed to update subscription tier" });
        return;
      }

      console.log(
        `[sync-subscription] Synced user ${userId} to tier: ${tier}`
      );
      res.json({ tier });
    } catch (err) {
      console.error("[sync-subscription] Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /account/delete
accountRouter.post("/delete", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;

  try {
    const supabase = createUserSupabaseClient(accessToken);

    // Get stripe_customer_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (userError) {
      res.status(500).json({ error: "Failed to fetch user data" });
      return;
    }

    // Cancel active Stripe subscriptions before deleting
    if (userData?.stripe_customer_id) {
      try {
        const stripe = getStripe();
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripe_customer_id,
          status: "active",
        });
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id, { invoice_now: false });
        }
      } catch (stripeError) {
        // Non-fatal — log and continue with deletion
        console.error("Error canceling Stripe subscriptions:", stripeError);
      }
    }

    // Reset household members' subscription tier before cascade deletes the household
    const serviceClient = createServiceRoleClient();

    const { data: ownedHousehold } = await serviceClient
      .from("households")
      .select("id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (ownedHousehold) {
      const { data: members } = await serviceClient
        .from("household_members")
        .select("user_id")
        .eq("household_id", ownedHousehold.id)
        .eq("status", "accepted");

      for (const member of members ?? []) {
        if (member.user_id) {
          await serviceClient
            .from("users")
            .update({ subscription_tier: "free" })
            .eq("id", member.user_id);
        }
      }
    }

    // Delete auth user (cascades to all related DB rows via FK constraints)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      res.status(500).json({ error: "Failed to delete account" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
