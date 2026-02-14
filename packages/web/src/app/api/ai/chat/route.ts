import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { aiChatMessageSchema, TIER_LIMITS } from "@kinpath/shared";

function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are KinPath AI, a warm and supportive parenting assistant.

RULES:
- Always ground your answers in the provided resource excerpts when available
- Cite resources by title when referencing them
- Never provide medical diagnoses or treatment plans
- For urgent medical concerns, always recommend contacting a pediatrician or calling emergency services
- Be warm, supportive, and non-judgmental regardless of parenting choices
- Respect the user's stated preferences (e.g., vaccine stance, feeding method) — present information neutrally
- If a question falls outside your vetted knowledge, say so honestly
- Never store, request, or reference protected health information
- Keep responses concise but thorough (aim for 2-4 paragraphs)`;

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = aiChatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { message, child_id } = parsed.data;

    // Check subscription tier and usage limits
    const { data: profile } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = profile?.subscription_tier ?? "free";
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

    if (limits.ai_questions_per_month !== null) {
      // Count this month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("ai_conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if ((count ?? 0) >= limits.ai_questions_per_month) {
        return NextResponse.json(
          {
            error: "Monthly AI question limit reached",
            limit: limits.ai_questions_per_month,
            upgrade_url: "/settings#subscription",
          },
          { status: 429 }
        );
      }
    }

    // Retrieve relevant resources via vector similarity (pgvector)
    // For now, use a basic text search fallback until embeddings are set up
    const { data: resources } = await supabase
      .from("resources")
      .select("id, title, summary, body")
      .eq("status", "published")
      .textSearch("title", message.split(" ").slice(0, 5).join(" & "), {
        type: "websearch",
      })
      .limit(5);

    // Build context from retrieved resources
    const resourceContext = resources?.length
      ? resources
          .map((r) => `## ${r.title}\n${r.summary}\n\n${r.body.slice(0, 500)}`)
          .join("\n\n---\n\n")
      : "No specific resources found for this query.";

    // Get user preferences for personalization
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const personalContext = prefs
      ? `\nUser preferences: feeding=${prefs.feeding_preference}, vaccines=${prefs.vaccine_stance}, parenting=${prefs.parenting_style}`
      : "";

    // Call Claude API
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}\n\nRELEVANT RESOURCES:\n${resourceContext}${personalContext}`,
      messages: [{ role: "user", content: message }],
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Save conversation
    const citedResourceIds = resources?.map((r) => r.id) ?? [];
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      child_id: child_id ?? null,
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: assistantMessage },
      ],
      cited_resource_ids: citedResourceIds,
    });

    return NextResponse.json({
      message: assistantMessage,
      cited_resources: resources?.map((r) => ({
        id: r.id,
        title: r.title,
      })),
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
