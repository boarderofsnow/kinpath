import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
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

      let tier: string = "premium";
      if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) {
        tier = "family";
      }

      await supabase
        .from("users")
        .update({
          subscription_tier: tier,
          stripe_customer_id: customerId,
        })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (subscription.status === "active") {
        const priceId = subscription.items.data[0]?.price.id;
        let tier = "premium";
        if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) {
          tier = "family";
        }

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
      // Unhandled event type — that's fine
      break;
  }

  return NextResponse.json({ received: true });
}
