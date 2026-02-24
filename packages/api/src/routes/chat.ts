import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient } from "../lib/supabase";

export const chatRouter = Router();

// POST /chat/save
chatRouter.post("/save", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const { conversation_id, title } = req.body;
  if (!conversation_id) {
    res.status(400).json({ error: "conversation_id is required" });
    return;
  }

  // Verify the conversation belongs to this user
  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("id, messages")
    .eq("id", conversation_id)
    .eq("user_id", userId)
    .single();

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const autoTitle =
    title ||
    (conversation.messages as Array<{ role: string; content: string }>)
      .find((m) => m.role === "user")
      ?.content.slice(0, 80) ||
    "Saved conversation";

  const { data: saved, error } = await supabase
    .from("saved_conversations")
    .upsert(
      { user_id: userId, conversation_id, title: autoTitle },
      { onConflict: "user_id,conversation_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Save conversation error:", error);
    res.status(500).json({ error: "Failed to save conversation" });
    return;
  }

  res.json(saved);
});

// DELETE /chat/save
chatRouter.delete("/save", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const { conversation_id } = req.body;
  if (!conversation_id) {
    res.status(400).json({ error: "conversation_id is required" });
    return;
  }

  const { error } = await supabase
    .from("saved_conversations")
    .delete()
    .eq("user_id", userId)
    .eq("conversation_id", conversation_id);

  if (error) {
    console.error("Unsave conversation error:", error);
    res.status(500).json({ error: "Failed to unsave conversation" });
    return;
  }

  res.json({ success: true });
});
