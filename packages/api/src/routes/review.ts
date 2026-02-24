import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient, createServiceRoleClient } from "../lib/supabase";

export const reviewRouter = Router();

const VALID_STATUSES = ["approved", "rejected", "needs_revision"];

// POST /review/submit
reviewRouter.post("/submit", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  // Verify requesting user is an active reviewer
  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true)
    .single();

  if (!reviewer) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { resource_id, status, review_notes, credentials_verified } = req.body;

  if (!resource_id) {
    res.status(400).json({ error: "resource_id is required" });
    return;
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  // Confirm resource is assigned to this reviewer
  const { data: resource } = await supabase
    .from("resources")
    .select("id")
    .eq("id", resource_id)
    .eq("assigned_reviewer_id", reviewer.id)
    .single();

  if (!resource) {
    res.status(404).json({ error: "Resource not found or not assigned to you" });
    return;
  }

  const serviceSupabase = createServiceRoleClient();

  // Upsert the review (one review per reviewer per resource)
  const { error: reviewError } = await serviceSupabase
    .from("professional_reviews")
    .upsert(
      {
        resource_id,
        reviewer_id: reviewer.id,
        status,
        review_notes: review_notes ?? null,
        credentials_verified: credentials_verified ?? false,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "resource_id,reviewer_id" }
    );

  if (reviewError) {
    // Fallback: try insert or update manually if upsert fails
    const { data: existing } = await serviceSupabase
      .from("professional_reviews")
      .select("id")
      .eq("resource_id", resource_id)
      .eq("reviewer_id", reviewer.id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await serviceSupabase
        .from("professional_reviews")
        .update({
          status,
          review_notes: review_notes ?? null,
          credentials_verified: credentials_verified ?? false,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Failed to update review:", updateError);
        res.status(500).json({ error: "Failed to update review" });
        return;
      }
    } else {
      const { error: insertError } = await serviceSupabase
        .from("professional_reviews")
        .insert({
          resource_id,
          reviewer_id: reviewer.id,
          status,
          review_notes: review_notes ?? null,
          credentials_verified: credentials_verified ?? false,
          reviewed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Failed to insert review:", insertError);
        res.status(500).json({ error: "Failed to submit review" });
        return;
      }
    }
  }

  res.json({ success: true });
});
