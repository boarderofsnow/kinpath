import { Router, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient } from "../lib/supabase";
import { aiChatMessageSchema, TIER_LIMITS } from "@kinpath/shared";

export const aiRouter = Router();

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

const SYSTEM_PROMPT = `You are KinPath AI, a warm and supportive parenting assistant.

RULES:
- Always ground your answers in the provided resource excerpts when available
- When referencing a resource, cite it using a bracketed number like [1], [2] matching the order of the RELEVANT RESOURCES provided below
- Never provide medical diagnoses or treatment plans
- For urgent medical concerns, always recommend contacting a pediatrician or calling emergency services
- Be warm, supportive, and non-judgmental regardless of parenting choices
- Respect the user's stated preferences (e.g., vaccine stance, feeding method) — present information neutrally
- If a question falls outside your vetted knowledge, say so honestly
- Never store, request, or reference protected health information
- Keep responses concise but thorough (aim for 2-4 paragraphs)
- Use markdown formatting: **bold** for emphasis, bullet lists for multiple points, numbered lists for steps`;

// POST /ai/chat
aiRouter.post("/chat", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const parsed = aiChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { message, child_id } = parsed.data;

  // Check subscription tier and enforce monthly usage limits
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  const tier = profile?.subscription_tier ?? "free";
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  if (limits.ai_questions_per_month !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("ai_conversations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= limits.ai_questions_per_month) {
      res.status(429).json({
        error: "Monthly AI question limit reached",
        limit: limits.ai_questions_per_month,
        upgrade_url: "/settings#subscription",
      });
      return;
    }
  }

  // Retrieve relevant resources via text search
  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, summary, body")
    .eq("status", "published")
    .textSearch("title", message.split(" ").slice(0, 5).join(" & "), {
      type: "websearch",
    })
    .limit(5);

  const resourceContext = resources?.length
    ? resources
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.summary}\n\n${r.body.slice(0, 500)}`)
        .join("\n\n---\n\n")
    : "No specific resources found for this query.";

  // Get user preferences for personalisation
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  const personalContext = prefs
    ? `\nUser preferences: feeding=${prefs.feeding_preference}, vaccines=${prefs.vaccine_stance}, parenting=${prefs.parenting_style}`
    : "";

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}\n\nRELEVANT RESOURCES:\n${resourceContext}${personalContext}`,
      messages: [{ role: "user", content: message }],
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    const citedResourceIds = resources?.map((r) => r.id) ?? [];
    const { data: savedConversation } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: userId,
        child_id: child_id ?? null,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: assistantMessage },
        ],
        cited_resource_ids: citedResourceIds,
      })
      .select("id")
      .single();

    res.json({
      message: assistantMessage,
      conversation_id: savedConversation?.id ?? null,
      cited_resources: resources?.map((r) => ({ id: r.id, title: r.title })),
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
