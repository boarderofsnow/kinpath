import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient } from "../lib/supabase";
import { getStripe, resolvePriceId } from "../lib/stripe";
import Stripe from "stripe";

export const stripeRouter = Router();

// POST /stripe/checkout
stripeRouter.post("/checkout", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const { plan, interval = "monthly" } = req.body as {
    plan?: string;
    interval?: string;
  };

  if (plan !== "premium" && plan !== "family") {
    res.status(400).json({ error: "Invalid plan. Must be 'premium' or 'family'" });
    return;
  }
  if (interval !== "monthly" && interval !== "annual") {
    res.status(400).json({ error: "Invalid interval. Must be 'monthly' or 'annual'" });
    return;
  }

  const priceId = resolvePriceId(plan, interval);
  if (!priceId) {
    res.status(500).json({ error: `Price ID not configured for ${plan}/${interval}` });
    return;
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  if (userError) {
    res.status(500).json({ error: "Failed to fetch user data" });
    return;
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: { metadata: { userId, plan } },
      allow_promotion_codes: true,
    };

    if (userData.stripe_customer_id) {
      // If already subscribed, redirect to portal to manage plan
      const existingSubs = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        status: "active",
        limit: 1,
      });
      if (existingSubs.data.length > 0) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: userData.stripe_customer_id,
          return_url: `${appUrl}/settings`,
        });
        res.json({ url: portal.url });
        return;
      }
      sessionParams.customer = userData.stripe_customer_id;
    } else {
      sessionParams.customer_email = userData.email;
    }

    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    // Save stripe_customer_id for new customers
    if (!userData.stripe_customer_id && stripeSession.customer) {
      const customerId =
        typeof stripeSession.customer === "string"
          ? stripeSession.customer
          : stripeSession.customer.id;
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    res.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /stripe/portal
stripeRouter.post("/portal", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (userError) {
    res.status(500).json({ error: "Failed to fetch user data" });
    return;
  }

  if (!userData.stripe_customer_id) {
    res.status(400).json({ error: "No active subscription found" });
    return;
  }

  try {
    const stripe = getStripe();
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
