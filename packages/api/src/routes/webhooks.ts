import { Router, Request, Response } from "express";
import { createServiceRoleClient } from "../lib/supabase";
import { getStripe, resolveTier } from "../lib/stripe";
import Stripe from "stripe";

export const webhooksRouter = Router();

// POST /webhooks/stripe
// NOTE: This route requires the raw request body for Stripe signature verification.
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
        const tier = resolveTier(priceId);
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabase
            .from("users")
            .update({ subscription_tier: tier, stripe_customer_id: customerId })
            .eq("id", userId);
        } else {
          await supabase
            .from("users")
            .update({ subscription_tier: tier, stripe_customer_id: customerId })
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
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err);
    // Return 200 to Stripe anyway — retrying won't help if our DB op failed
  }

  res.json({ received: true });
});
