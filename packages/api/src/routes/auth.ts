import { Router, Request, Response } from "express";
import { createServerSupabaseClient, createServiceRoleClient } from "../lib/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";

export const authRouter = Router();

// GET /auth/callback
// Handles both PKCE code exchange and email OTP verification.
// After verifying the user, links any pending household invite and redirects.
authRouter.get("/callback", async (req: Request, res: Response) => {
  const { code, token_hash, type, next = "/dashboard" } = req.query as Record<string, string>;
  const origin = `${req.protocol}://${req.get("host")}`;
  const appUrl = process.env.APP_URL || origin;

  const supabase = createServerSupabaseClient();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;

  if (code) {
    // PKCE flow — used by signUp, signInWithOtp, resetPasswordForEmail
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) user = data.user;
  } else if (token_hash && type) {
    // Email link flow — token_hash passed directly as a query param
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (!error && data.user) user = data.user;
  }

  if (user) {
    // ── Household invite linking ──────────────────────────────────
    let householdMemberId = user.user_metadata?.household_member_id as
      | string
      | undefined;

    // Fallback: match pending invite by email if metadata wasn't set
    if (!householdMemberId && user.email) {
      const serviceClient = createServiceRoleClient();
      const { data: pendingInvite } = await serviceClient
        .from("household_members")
        .select("id")
        .eq("invited_email", user.email.toLowerCase())
        .is("user_id", null)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingInvite) {
        householdMemberId = pendingInvite.id;
      }
    }

    if (householdMemberId) {
      try {
        const serviceClient = createServiceRoleClient();

        const { data: memberRow } = await serviceClient
          .from("household_members")
          .select(
            "household_id, households!inner(owner_user_id, users!inner(subscription_tier))"
          )
          .eq("id", householdMemberId)
          .single();

        await serviceClient
          .from("household_members")
          .update({
            user_id: user.id,
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", householdMemberId);

        // Copy the owner's subscription_tier. Do NOT set onboarding_complete —
        // let them go through the onboarding flow for preferences.
        const ownerTier =
          (memberRow as any)?.households?.users?.subscription_tier ?? "free";

        await serviceClient
          .from("users")
          .update({ subscription_tier: ownerTier })
          .eq("id", user.id);
      } catch (linkError) {
        console.error(
          "Failed to link household member on invite accept:",
          linkError
        );
        // Non-fatal — continue
      }

      // Send invited partners to onboarding (not dashboard)
      res.redirect(`${appUrl}/onboarding`);
      return;
    }

    res.redirect(`${appUrl}${next}`);
    return;
  }

  res.redirect(`${appUrl}/auth/login?error=auth_failed`);
});
