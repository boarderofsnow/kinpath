import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { TIER_LIMITS, type SubscriptionTier } from "@kinpath/shared";

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
function resolveTier(priceId: string | undefined): SubscriptionTier {
  if (
    priceId === process.env.STRIPE_FAMILY_PRICE_ID ||
    priceId === process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID
  ) {
    return "family";
  }
  return "premium";
}

/**
 * Sync household max_members and handle excess members on tier change.
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

  // Update the max_members cap
  await supabase
    .from("households")
    .update({ max_members: maxMembers })
    .eq("id", household.id);

  // If downgrading, handle excess members
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
    // Check if current members exceed new limit
    const { data: activeMembers } = await supabase
      .from("household_members")
      .select("id, user_id")
      .eq("household_id", household.id)
      .neq("status", "declined")
      .order("invited_at", { ascending: true });

    if (activeMembers && activeMembers.length > maxMembers) {
      // Keep the oldest members up to the limit, decline the rest
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

        await syncHousehold(supabase, userId, tier);
      } else {
        // Fallback: match by stripe_customer_id (existing customers)
        const { data: user } = await supabase
          .from("users")
          .update({
            subscription_tier: tier,
            stripe_customer_id: customerId,
          })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .single();

        if (user) {
          await syncHousehold(supabase, user.id, tier);
        }
      }

      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (subscription.status === "active") {
        const priceId = subscription.items.data[0]?.price.id;
        const tier = resolveTier(priceId);

        const { data: user } = await supabase
          .from("users")
          .update({ subscription_tier: tier })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .single();

        if (user) {
          await syncHousehold(supabase, user.id, tier);
        }
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

      if (user) {
        await syncHousehold(supabase, user.id, "free");
      }

      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
