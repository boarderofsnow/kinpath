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

  // Insert the household member invite row
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

  // Send magic link invite via Supabase Auth
  const appUrl = process.env.APP_URL ?? "";
  const { error: inviteError } = await serviceSupabase.auth.admin.inviteUserByEmail(
    email.toLowerCase(),
    {
      data: { household_member_id: member.id, invited_by: userId },
      redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
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
