import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient, createServiceRoleClient } from "../lib/supabase";
import { getStripe } from "../lib/stripe";

export const accountRouter = Router();

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

    // Delete auth user (cascades to all related DB rows via FK constraints)
    const serviceClient = createServiceRoleClient();
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
