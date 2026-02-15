import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

export async function POST() {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's stripe_customer_id from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // Cancel Stripe subscriptions if customer exists
    if (userData?.stripe_customer_id) {
      const stripe = getStripe();
      if (stripe) {
        try {
          // List active subscriptions for this customer
          const subscriptions = await stripe.subscriptions.list({
            customer: userData.stripe_customer_id,
            status: "active",
          });

          // Cancel each subscription immediately
          for (const subscription of subscriptions.data) {
            await stripe.subscriptions.cancel(subscription.id, {
              invoice_now: false,
            });
          }
        } catch (stripeError) {
          console.error("Error canceling Stripe subscriptions:", stripeError);
          // Continue with account deletion even if Stripe cancellation fails
        }
      }
    }

    // Delete user from auth (cascades to delete all related data)
    const serviceRoleClient = createServiceRoleClient();
    const { error: deleteError } = await serviceRoleClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
