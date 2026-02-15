import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

/**
 * Resolve a plan + interval to the correct Stripe Price ID.
 * Env vars follow the pattern STRIPE_<PLAN>_<INTERVAL>_PRICE_ID,
 * falling back to STRIPE_<PLAN>_PRICE_ID for monthly (legacy).
 */
function resolvePriceId(
  plan: "premium" | "family",
  interval: "monthly" | "annual"
): string | undefined {
  if (interval === "annual") {
    return plan === "premium"
      ? process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
      : process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID;
  }
  // monthly
  return plan === "premium"
    ? process.env.STRIPE_PREMIUM_PRICE_ID
    : process.env.STRIPE_FAMILY_PRICE_ID;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, interval = "monthly" } = body as {
      plan?: string;
      interval?: string;
    };

    if (plan !== "premium" && plan !== "family") {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'premium' or 'family'" },
        { status: 400 }
      );
    }

    if (interval !== "monthly" && interval !== "annual") {
      return NextResponse.json(
        { error: "Invalid interval. Must be 'monthly' or 'annual'" },
        { status: 400 }
      );
    }

    const priceId = resolvePriceId(plan, interval);
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${plan}/${interval}` },
        { status: 500 }
      );
    }

    // Look up user in Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      allow_promotion_codes: true,
    };

    if (userData.stripe_customer_id) {
      // Check if customer already has an active subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        status: "active",
        limit: 1,
      });

      if (existingSubs.data.length > 0) {
        // Already subscribed — redirect to portal to manage/change plan
        const portal = await stripe.billingPortal.sessions.create({
          customer: userData.stripe_customer_id,
          return_url: `${appUrl}/settings`,
        });
        return NextResponse.json({ url: portal.url });
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
        .eq("id", user.id);
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
