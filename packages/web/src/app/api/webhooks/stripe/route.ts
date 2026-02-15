import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

/**
 * Resolve a Stripe Price ID to a KinPath subscription tier.
 */
function resolveTier(priceId: string | undefined): string {
  if (
    priceId === process.env.STRIPE_FAMILY_PRICE_ID ||
    priceId === process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID
  ) {
    return "family";
  }
  return "premium";
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Get the subscription to determine the tier
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const tier = resolveTier(priceId);

      // Use userId from metadata if available (most reliable for new customers)
      const userId = subscription.metadata?.userId;

      if (userId) {
        // Update by user ID — works for new and existing customers
        await supabase
          .from("users")
          .update({
            subscription_tier: tier,
            stripe_customer_id: customerId,
          })
          .eq("id", userId);
      } else {
        // Fallback: match by stripe_customer_id (existing customers)
        await supabase
          .from("users")
          .update({
            subscription_tier: tier,
            stripe_customer_id: customerId,
          })
          .eq("stripe_customer_id", customerId);
      }

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (subscription.status === "active") {
        const priceId = subscription.items.data[0]?.price.id;
        const tier = resolveTier(priceId);

        await supabase
          .from("users")
          .update({ subscription_tier: tier })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from("users")
        .update({ subscription_tier: "free" })
        .eq("stripe_customer_id", customerId);

      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
