import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;

      // If this user was invited as a household partner, link them now.
      // inviteUserByEmail stores household_member_id in user_metadata.
      const householdMemberId = user.user_metadata?.household_member_id as string | undefined;

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
  }

  // Return the user to login with an error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
