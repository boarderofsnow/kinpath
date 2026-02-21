import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createServerSupabaseClient();
  let user;

  if (code) {
    // PKCE flow — used by signUp, signInWithOtp, resetPasswordForEmail
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) user = data.user;
  } else if (tokenHash && type) {
    // Email link flow — used by custom invite template that passes
    // token_hash directly as a query param (bypasses Supabase's verify
    // endpoint so we avoid the hash-fragment-only redirect problem).
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error && data.user) user = data.user;
  }

  if (user) {
    // ── Household invite linking ──────────────────────────────────
    // Strategy 1: check user_metadata for household_member_id
    //   (set when inviteUserByEmail is called with data: { household_member_id })
    let householdMemberId =
      user.user_metadata?.household_member_id as string | undefined;

    // Strategy 2: fallback — match pending invite by email.
    //   Handles the case where a user registered manually instead of
    //   clicking the invite link, so metadata was never set.
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

        // 1. Fetch the member record to get household_id and the owner's subscription_tier.
        const { data: memberRow } = await serviceClient
          .from("household_members")
          .select("household_id, households!inner(owner_user_id, users!inner(subscription_tier))")
          .eq("id", householdMemberId)
          .single();

        // 2. Link the household_members record to this user and mark accepted.
        await serviceClient
          .from("household_members")
          .update({
            user_id: user.id,
            status: "accepted",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", householdMemberId);

        // 3. Skip onboarding AND copy the owner's subscription_tier so the
        //    partner's Settings page shows the correct plan immediately.
        const ownerTier =
          (memberRow as any)?.households?.users?.subscription_tier ?? "free";

        await serviceClient
          .from("users")
          .update({ onboarding_complete: true, subscription_tier: ownerTier })
          .eq("id", user.id);
      } catch (linkError) {
        // Non-fatal — log and continue to dashboard.
        console.error("Failed to link household member on invite accept:", linkError);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // Return the user to login with an error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
