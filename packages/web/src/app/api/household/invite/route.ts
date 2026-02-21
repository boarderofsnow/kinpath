import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/household/invite
 * Invite a partner to the user's household.
 * Creates a household if one doesn't exist yet.
 * Only available for family tier users.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check subscription tier
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier !== "family") {
    return NextResponse.json(
      { error: "Partner sharing requires a Family plan." },
      { status: 403 }
    );
  }

  let body: { email?: string; display_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, display_name } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const serviceSupabase = createServiceRoleClient();

  // Get or create household owned by this user
  let { data: household } = await serviceSupabase
    .from("households")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!household) {
    const { data: newHousehold, error: householdError } = await serviceSupabase
      .from("households")
      .insert({ owner_user_id: user.id })
      .select("id")
      .single();

    if (householdError || !newHousehold) {
      console.error("Failed to create household:", householdError);
      return NextResponse.json({ error: "Failed to create household." }, { status: 500 });
    }
    household = newHousehold;
  }

  // Check if already invited
  const { data: existing } = await serviceSupabase
    .from("household_members")
    .select("id, status")
    .eq("household_id", household.id)
    .eq("invited_email", email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This email has already been invited." },
      { status: 409 }
    );
  }

  // Insert the household member invite
  const { data: member, error: memberError } = await serviceSupabase
    .from("household_members")
    .insert({
      household_id: household.id,
      invited_email: email.toLowerCase(),
      display_name: display_name?.trim() || null,
      role: "partner",
      status: "pending",
    })
    .select("id")
    .single();

  if (memberError || !member) {
    console.error("Failed to create household member:", memberError);
    return NextResponse.json({ error: "Failed to send invite." }, { status: 500 });
  }

  // Send a magic link invite via Supabase Auth (inviteUserByEmail)
  // This creates an account for the partner if they don't have one,
  // or sends a login link if they do.
  const { error: inviteError } = await serviceSupabase.auth.admin.inviteUserByEmail(
    email.toLowerCase(),
    {
      data: {
        household_member_id: member.id,
        invited_by: user.id,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/auth/callback?next=/dashboard`,
    }
  );

  if (inviteError) {
    // Don't fail the whole operation — the record is created, the user can resend
    console.warn("Failed to send invite email:", inviteError.message);
  }

  return NextResponse.json({ success: true, member_id: member.id });
}

/**
 * DELETE /api/household/invite
 * Remove a household member (pending invite or accepted partner).
 * If the member had accepted, their subscription_tier is reset to "free".
 */
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { member_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.member_id) {
    return NextResponse.json({ error: "member_id is required." }, { status: 400 });
  }

  const serviceSupabase = createServiceRoleClient();

  // Confirm the member belongs to a household owned by this user
  const { data: member } = await serviceSupabase
    .from("household_members")
    .select("id, household_id, user_id, households!inner(owner_user_id)")
    .eq("id", body.member_id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  const household = (member as Record<string, unknown>).households as { owner_user_id: string } | null;
  if (!household || household.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error: deleteError } = await serviceSupabase
    .from("household_members")
    .delete()
    .eq("id", body.member_id);

  if (deleteError) {
    console.error("Failed to delete household member:", deleteError);
    return NextResponse.json({ error: "Failed to remove invite." }, { status: 500 });
  }

  // If the partner had accepted (user_id is set), reset their subscription tier back to free.
  const partnerUserId = (member as Record<string, unknown>).user_id as string | null;
  if (partnerUserId) {
    await serviceSupabase
      .from("users")
      .update({ subscription_tier: "free" })
      .eq("id", partnerUserId);
  }

  return NextResponse.json({ success: true });
}
