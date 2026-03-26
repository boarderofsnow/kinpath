import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient } from "../lib/supabase";
import {
  birthUpdateSchema,
  MILESTONE_TEMPLATES,
  getRelevantMilestones,
  calculateMilestoneDate,
  toISODateString,
} from "@kinpath/shared";

export const childrenRouter = Router();

/**
 * POST /children/:childId/mark-born
 *
 * Transitions a prenatal child to born status.
 * Sets is_born = true, records the birth date, preserves due_date,
 * and seeds postpartum milestone checklist items.
 */
childrenRouter.post(
  "/:childId/mark-born",
  requireAuth,
  async (req, res: Response) => {
    const { userId, accessToken } = req as AuthenticatedRequest;
    const { childId } = req.params;

    // Validate request body
    const parsed = birthUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { dob, name } = parsed.data;
    const supabase = createUserSupabaseClient(accessToken);

    // Fetch the child and verify it belongs to this user and is prenatal
    const { data: child, error: fetchError } = await supabase
      .from("children")
      .select("*")
      .eq("id", childId)
      .single();

    if (fetchError || !child) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    if (child.user_id !== userId) {
      // Check if user is a household partner
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", userId)
        .eq("status", "accepted")
        .single();

      if (!membership) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }

      // Verify the child's owner is in the same household
      const { data: ownerMembership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", child.user_id)
        .eq("household_id", membership.household_id)
        .single();

      if (!ownerMembership) {
        res.status(403).json({ error: "Not authorized" });
        return;
      }
    }

    if (child.is_born) {
      res.status(409).json({ error: "This child is already marked as born" });
      return;
    }

    // Update the child: set is_born, dob, optionally name — preserve due_date
    const updateData: Record<string, unknown> = {
      is_born: true,
      dob,
    };
    if (name) {
      updateData.name = name;
    }

    const { data: updatedChild, error: updateError } = await supabase
      .from("children")
      .update(updateData)
      .eq("id", childId)
      .eq("is_born", false) // Guard: only update if still prenatal
      .select()
      .single();

    if (updateError || !updatedChild) {
      res.status(500).json({ error: "Failed to update child" });
      return;
    }

    // Seed postpartum milestones
    let milestonesAdded = 0;
    try {
      // Get existing milestone keys for this child
      const { data: existingItems } = await supabase
        .from("checklist_items")
        .select("milestone_key")
        .eq("child_id", childId)
        .eq("item_type", "milestone")
        .not("milestone_key", "is", null);

      const existingKeys = new Set(
        (existingItems ?? []).map((item: { milestone_key: string }) => item.milestone_key)
      );

      // Filter to postpartum/development milestones relevant for the newly-born child
      const postBirthTemplates = MILESTONE_TEMPLATES.filter(
        (t) => t.category === "postpartum" || t.category === "development"
      );

      const relevantTemplates = getRelevantMilestones(
        updatedChild,
        postBirthTemplates,
        existingKeys
      );

      if (relevantTemplates.length > 0) {
        const newItems = relevantTemplates.map((t, i) => {
          const milestoneDate = calculateMilestoneDate(updatedChild, t);
          return {
            child_id: childId,
            user_id: child.user_id, // Always use the child owner's user_id
            title: t.title,
            description: t.description,
            item_type: "milestone" as const,
            milestone_key: t.key,
            suggested_date: milestoneDate ? toISODateString(milestoneDate) : null,
            sort_order: i,
          };
        });

        const { error: insertError } = await supabase
          .from("checklist_items")
          .insert(newItems);

        if (!insertError) {
          milestonesAdded = newItems.length;
        }
      }
    } catch {
      // Milestone seeding is best-effort — don't fail the birth update
      console.error("Failed to seed postpartum milestones for child:", childId);
    }

    res.json({
      success: true,
      child: updatedChild,
      milestones_added: milestonesAdded,
    });
  }
);
