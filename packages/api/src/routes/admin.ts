import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient, createServiceRoleClient } from "../lib/supabase";
import { runWeeklyDigest } from "../cron/digest";

export const adminRouter = Router();

const ALL_STATUSES = ["draft", "in_review", "published", "rejected", "archived"];

// PATCH /admin/resources/:slug
adminRouter.patch("/resources/:slug", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const { slug } = req.params;
  const supabase = createUserSupabaseClient(accessToken);

  // Verify requesting user is an admin
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_admin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { status, assigned_reviewer_id, publish } = req.body as {
    status?: string;
    assigned_reviewer_id?: string | null;
    publish?: boolean;
  };

  if (status && !ALL_STATUSES.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const serviceSupabase = createServiceRoleClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (status) updates.status = status;
  if ("assigned_reviewer_id" in req.body) {
    updates.assigned_reviewer_id = assigned_reviewer_id ?? null;
  }
  if (publish || status === "published") {
    updates.status = "published";
    updates.vetted_at = new Date().toISOString();
    updates.vetted_by = userId;
  }

  const { error } = await serviceSupabase
    .from("resources")
    .update(updates)
    .eq("slug", slug);

  if (error) {
    console.error("Failed to update resource:", error);
    res.status(500).json({ error: "Failed to update resource" });
    return;
  }

  res.json({ success: true });
});

// POST /admin/digest/trigger — manually fire the digest email
adminRouter.post("/digest/trigger", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_admin) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const result = await runWeeklyDigest({ force: true });
    res.json(result);
  } catch (err) {
    console.error("[admin] Digest trigger failed:", err);
    res.status(500).json({ error: "Digest trigger failed" });
  }
});
