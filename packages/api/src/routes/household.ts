import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient, createServiceRoleClient } from "../lib/supabase";

export const householdRouter = Router();

// POST /household/invite
householdRouter.post("/invite", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  // Check subscription tier
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  if (profile?.subscription_tier !== "family") {
    res.status(403).json({ error: "Partner sharing requires a Family plan." });
    return;
  }

  const { email, display_name } = req.body as {
    email?: string;
    display_name?: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "A valid email is required." });
    return;
  }

  const serviceSupabase = createServiceRoleClient();

  // Get or create household owned by this user
  let { data: household } = await serviceSupabase
    .from("households")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (!household) {
    const { data: newHousehold, error: householdError } = await serviceSupabase
      .from("households")
      .insert({ owner_user_id: userId })
      .select("id")
      .single();

    if (householdError || !newHousehold) {
      console.error("Failed to create household:", householdError);
      res.status(500).json({ error: "Failed to create household." });
      return;
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
    res.status(409).json({ error: "This email has already been invited." });
    return;
  }

  // Check if partner already has an account (all users have a row in public.users)
  const { data: existingPartner } = await serviceSupabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existingPartner) {
    // ── Partner already has an account → link directly ──────────────
    const { data: member, error: memberError } = await serviceSupabase
      .from("household_members")
      .insert({
        household_id: household.id,
        invited_email: email.toLowerCase(),
        display_name: display_name?.trim() || null,
        role: "partner",
        status: "accepted",
        user_id: existingPartner.id,
        accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (memberError || !member) {
      console.error("Failed to create household member:", memberError);
      res.status(500).json({ error: "Failed to link partner." });
      return;
    }

    // Copy owner's subscription_tier to the partner
    const { data: ownerProfile } = await serviceSupabase
      .from("users")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (ownerProfile?.subscription_tier) {
      await serviceSupabase
        .from("users")
        .update({ subscription_tier: ownerProfile.subscription_tier })
        .eq("id", existingPartner.id);
    }

    res.json({ success: true, member_id: member.id, linked: true });
    return;
  }

  // ── Partner is new → create pending invite + send email ───────────
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
    res.status(500).json({ error: "Failed to send invite." });
    return;
  }

  // The redirect must go to the web app's auth callback (Next.js route)
  const webUrl = process.env.APP_URL || "https://kinpath.family";
  const { error: inviteError } = await serviceSupabase.auth.admin.inviteUserByEmail(
    email.toLowerCase(),
    {
      data: { household_member_id: member.id, invited_by: userId },
      redirectTo: `${webUrl}/api/auth/callback?next=/auth/complete-profile`,
    }
  );

  if (inviteError) {
    // Roll back member row so the same email can be retried
    await serviceSupabase.from("household_members").delete().eq("id", member.id);
    console.error("Failed to send invite email:", inviteError.message);
    res.status(500).json({ error: "Failed to send invite. Please try again." });
    return;
  }

  res.json({ success: true, member_id: member.id });
});

// POST /household/accept-pending
// Called on login (especially mobile) to auto-accept any pending invite
// matching the authenticated user's email.
householdRouter.post("/accept-pending", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);
  const serviceSupabase = createServiceRoleClient();

  // Get the user's email
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    res.json({ accepted: false });
    return;
  }

  // Check for a pending invite matching this email
  const { data: pendingInvite } = await serviceSupabase
    .from("household_members")
    .select("id, household_id, households!inner(owner_user_id)")
    .eq("invited_email", user.email.toLowerCase())
    .is("user_id", null)
    .eq("status", "pending")
    .maybeSingle();

  if (!pendingInvite) {
    res.json({ accepted: false });
    return;
  }

  // Accept the invite
  const { error: updateError } = await serviceSupabase
    .from("household_members")
    .update({
      user_id: userId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", pendingInvite.id);

  if (updateError) {
    console.error("Failed to accept pending invite:", updateError);
    res.status(500).json({ error: "Failed to accept invite." });
    return;
  }

  // Copy owner's subscription_tier to partner
  const ownerUserId = (pendingInvite as any).households?.owner_user_id;
  if (ownerUserId) {
    const { data: ownerProfile } = await serviceSupabase
      .from("users")
      .select("subscription_tier")
      .eq("id", ownerUserId)
      .single();

    if (ownerProfile?.subscription_tier) {
      await serviceSupabase
        .from("users")
        .update({ subscription_tier: ownerProfile.subscription_tier })
        .eq("id", userId);
    }
  }

  res.json({ accepted: true, household_id: pendingInvite.household_id });
});

// DELETE /household/invite
householdRouter.delete("/invite", requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const { member_id } = req.body as { member_id?: string };

  if (!member_id) {
    res.status(400).json({ error: "member_id is required." });
    return;
  }

  const serviceSupabase = createServiceRoleClient();

  // Confirm member belongs to a household owned by this user
  const { data: member } = await serviceSupabase
    .from("household_members")
    .select("id, household_id, user_id, households!inner(owner_user_id)")
    .eq("id", member_id)
    .maybeSingle();

  if (!member) {
    res.status(404).json({ error: "Invite not found." });
    return;
  }

  const household = (member as Record<string, unknown>).households as {
    owner_user_id: string;
  } | null;

  if (!household || household.owner_user_id !== userId) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const { error: deleteError } = await serviceSupabase
    .from("household_members")
    .delete()
    .eq("id", member_id);

  if (deleteError) {
    console.error("Failed to delete household member:", deleteError);
    res.status(500).json({ error: "Failed to remove invite." });
    return;
  }

  // If partner had accepted, reset their subscription tier to free
  const partnerUserId = (member as Record<string, unknown>).user_id as string | null;
  if (partnerUserId) {
    await serviceSupabase
      .from("users")
      .update({ subscription_tier: "free" })
      .eq("id", partnerUserId);
  }

  res.json({ success: true });
});
