import { Router, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { createUserSupabaseClient } from "../lib/supabase";
import { aiChatMessageSchema, TIER_LIMITS } from "@kinpath/shared";

export const aiRouter = Router();

/** Strip URL to base origin only (scheme + host) to avoid linking to dead deep-link paths. */
function toBaseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return raw;
  }
}

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

const SYSTEM_PROMPT = `You are KinPath AI, a warm and supportive parenting assistant.

RULES:
- CITATION IS MANDATORY: Every response that makes a factual claim MUST include at least one citation.
  - Always use bracketed numbers [1], [2], etc. inline for every citation — never use any other format.
  - If RELEVANT RESOURCES are provided below, cite them as [1], [2] matching the list order.
  - For any authoritative external source not covered by provided resources, continue the numbering (e.g. [3]) and append a SOURCES block at the very end of your response in this exact format (do not include it in the conversational text):
    <<<SOURCES>>>
    [N] Source Name: https://root-domain-only.example.com
    <<<END_SOURCES>>>
  - CRITICAL URL RULE: In the SOURCES block, use ONLY the root domain URL — NEVER a specific page path.
    Correct:   [3] ACOG: https://www.acog.org
    Incorrect: [3] ACOG Stages of Labor: https://www.acog.org/clinical/guidance/committee-opinion/articles/...
  - IMPORTANT: If you emit [N] inline for an external source, you MUST include the SOURCES block at the end.
    Omitting the SOURCES block causes broken references. There are NO exceptions — every external citation
    number must have a corresponding SOURCES entry.
  - Acceptable external sources:
    Clinical guidelines: ACOG (https://www.acog.org), NICE (https://www.nice.org.uk), WHO (https://www.who.int), Cochrane (https://www.cochranelibrary.com)
    Child development: AAP (https://www.aap.org), CDC (https://www.cdc.gov), Zero to Three (https://www.zerotothree.org)
    Postpartum mental health: PSI (https://www.postpartum.net), MGH Women's Mental Health (https://womensmentalhealth.org), LactMed (https://www.ncbi.nlm.nih.gov)
    Lactation & feeding: La Leche League (https://www.llli.org), Academy of Breastfeeding Medicine (https://www.bfmed.org), Evidence Based Birth (https://evidencebasedbirth.com)
    Drug safety: MotherToBaby (https://mothertobaby.org), Mayo Clinic (https://www.mayoclinic.org)
    Also acceptable: Williams Obstetrics, Gabbe's Obstetrics, Nelson Textbook of Pediatrics (cite by title and edition, no URL needed)
  - If you genuinely cannot find a reputable source for a claim, acknowledge the uncertainty explicitly — never state unsupported facts as certainties.
- Never provide medical diagnoses or treatment plans
- For urgent medical concerns, always recommend contacting a pediatrician or calling emergency services
- Be warm, supportive, and non-judgmental regardless of parenting choices
- Respect the user's stated preferences (e.g., vaccine stance, feeding method) — present information neutrally
- If a question falls outside your vetted knowledge, say so honestly
- Never store, request, or reference protected health information
- Keep responses concise but thorough (aim for 2-4 paragraphs)
- Use markdown formatting: **bold** for emphasis, bullet lists for multiple points, numbered lists for steps
- IMPORTANT: When child context is provided, always tailor your answer to the child's specific age and developmental stage. Reference the child by name when appropriate.
- PREFERENCE CHANGE DETECTION: If the user describes an actual change in their situation that conflicts with a known preference (birth_preference, feeding_preference, or parenting_style), append this block at the very end of your response (after content, after SOURCES if any):
  <<<PREF_UPDATE>>>{"field":"birth_preference","suggested_value":"hospital","reason":"You mentioned delivering at the hospital"}<<<END_PREF_UPDATE>>>
  Only emit this when the user states a fact about what DID happen, not hypotheticals.
  Valid fields and values:
    birth_preference: home | hospital | birth_center
    feeding_preference: breastfeeding | formula | combination
    parenting_style: attachment | gentle | montessori | rie | no_preference`;

/** Calculate a human-readable age string from a date of birth. */
function formatChildAge(dob: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - dob.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = Math.floor(totalDays / 30.44);
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  if (totalDays < 7) return `${totalDays} day${totalDays !== 1 ? "s" : ""} old`;
  if (totalWeeks < 12) return `${totalWeeks} week${totalWeeks !== 1 ? "s" : ""} old`;
  if (years < 1) return `${totalMonths} month${totalMonths !== 1 ? "s" : ""} old`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""} old`;
  return `${years} year${years !== 1 ? "s" : ""} and ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""} old`;
}

/** Calculate age in weeks (negative = prenatal). */
function ageInWeeks(child: { dob: string | null; due_date: string | null; is_born: boolean }): number {
  const now = new Date();
  if (child.is_born && child.dob) {
    const dob = new Date(child.dob);
    return Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 7));
  }
  if (child.due_date) {
    // Prenatal: negative weeks until due date (conception ≈ -40 weeks)
    const due = new Date(child.due_date);
    const weeksUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return -weeksUntilDue; // e.g. 20 weeks before due = -20 weeks from birth
  }
  return 0;
}

// POST /ai/chat
aiRouter.post("/chat", requireAuth, async (req, res: Response) => {
  const { userId, accessToken } = req as AuthenticatedRequest;
  const supabase = createUserSupabaseClient(accessToken);

  const parsed = aiChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { message, child_id, conversation_id } = parsed.data;

  // Check subscription tier and enforce monthly usage limits
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier, display_name")
    .eq("id", userId)
    .single();

  const tier = profile?.subscription_tier ?? "free";
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  let monthlyUsed = 0;
  let monthlyLimit: number | null = null;

  if (limits.ai_questions_per_month !== null) {
    monthlyLimit = limits.ai_questions_per_month;

    // Use UTC to avoid timezone-related boundary issues
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Count individual user turns (messages) across all conversations this month
    const { data: usageData } = await supabase
      .from("ai_conversations")
      .select("messages")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    monthlyUsed = (usageData ?? []).reduce((sum, row) => {
      const msgs = row.messages as Array<{ role: string }>;
      return sum + msgs.filter((m) => m.role === "user").length;
    }, 0);

    if (monthlyUsed >= monthlyLimit) {
      res.status(429).json({
        error: "Monthly AI question limit reached",
        limit: monthlyLimit,
        used: monthlyUsed,
        upgrade_url: "/pricing",
        show_upgrade_modal: true,
      });
      return;
    }
  }

  // ── Fetch prior conversation messages if continuing an existing chat ─────────
  type ChatMessage = { role: "user" | "assistant"; content: string };
  let priorMessages: ChatMessage[] = [];
  let existingConversation: { id: string; cited_resource_ids: string[] } | null = null;

  if (conversation_id) {
    const { data: existing } = await supabase
      .from("ai_conversations")
      .select("id, messages, cited_resource_ids")
      .eq("id", conversation_id)
      .eq("user_id", userId)
      .single();

    if (existing) {
      priorMessages = existing.messages as ChatMessage[];
      existingConversation = existing;
    }
  }

  // ── Fetch child data for personalisation ─────────────────────────────────
  let childContext = "";
  let childAgeWeeks: number | null = null;

  if (child_id) {
    const { data: child } = await supabase
      .from("children")
      .select("name, dob, due_date, is_born")
      .eq("id", child_id)
      .single();

    if (child) {
      childAgeWeeks = ageInWeeks(child);

      if (child.is_born && child.dob) {
        const ageStr = formatChildAge(new Date(child.dob));
        childContext = `\n\nCHILD CONTEXT:\nChild's name: ${child.name}\nAge: ${ageStr} (born ${child.dob})\nDevelopmental stage: ${childAgeWeeks < 12 ? "newborn" : childAgeWeeks < 26 ? "infant (3-6 months)" : childAgeWeeks < 52 ? "infant (6-12 months)" : childAgeWeeks < 78 ? "toddler (12-18 months)" : childAgeWeeks < 104 ? "toddler (18-24 months)" : childAgeWeeks < 156 ? "preschooler (2-3 years)" : "preschooler (3-5 years)"}`;
      } else if (child.due_date) {
        const dueDate = new Date(child.due_date);
        const now = new Date();
        const weeksPregnant = Math.max(0, 40 - Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        childContext = `\n\nCHILD CONTEXT:\nChild's name: ${child.name}\nStatus: Prenatal — approximately ${weeksPregnant} weeks pregnant (due ${child.due_date})\nTrimester: ${weeksPregnant < 13 ? "first" : weeksPregnant < 27 ? "second" : "third"}`;
      }
    }
  }

  // If no child_id provided, check if user has children and include general info
  if (!child_id) {
    const { data: children } = await supabase
      .from("children")
      .select("name, dob, due_date, is_born")
      .eq("user_id", userId);

    if (children && children.length > 0) {
      const childSummaries = children.map((c) => {
        if (c.is_born && c.dob) {
          return `${c.name} (${formatChildAge(new Date(c.dob))})`;
        } else if (c.due_date) {
          const dueDate = new Date(c.due_date);
          const now = new Date();
          const weeksPregnant = Math.max(0, 40 - Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7)));
          return `${c.name} (prenatal, ~${weeksPregnant} weeks)`;
        }
        return c.name;
      });
      childContext = `\n\nCHILD CONTEXT:\nUser's children: ${childSummaries.join(", ")}`;
      // Use the first child's age for resource filtering
      const firstChild = children[0];
      if (firstChild) childAgeWeeks = ageInWeeks(firstChild);
    }
  }

  // ── Retrieve relevant resources via text search ──────────────────────────
  let resourceQuery = supabase
    .from("resources")
    .select("id, title, slug, summary, body")
    .eq("status", "published")
    .textSearch("title", message.split(" ").slice(0, 5).join(" & "), {
      type: "websearch",
    });

  // Filter resources by child age range when available
  if (childAgeWeeks !== null) {
    resourceQuery = resourceQuery
      .lte("age_start_weeks", childAgeWeeks + 4) // small buffer
      .gte("age_end_weeks", childAgeWeeks - 4);
  }

  const { data: resources } = await resourceQuery.limit(5);

  // If age-filtered search returned no results, fall back to unfiltered search
  let finalResources = resources;
  if ((!resources || resources.length === 0) && childAgeWeeks !== null) {
    const { data: fallbackResources } = await supabase
      .from("resources")
      .select("id, title, slug, summary, body")
      .eq("status", "published")
      .textSearch("title", message.split(" ").slice(0, 5).join(" & "), {
        type: "websearch",
      })
      .limit(5);
    finalResources = fallbackResources;
  }

  const resourceContext = finalResources?.length
    ? finalResources
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.summary}\n\n${r.body.slice(0, 500)}`)
        .join("\n\n---\n\n")
    : "No specific resources found for this query.";

  // ── Get user preferences for personalisation ─────────────────────────────
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  let personalContext = "";
  if (prefs) {
    const prefParts: string[] = [];
    if (prefs.birth_preference) prefParts.push(`birth preference: ${prefs.birth_preference}`);
    if (prefs.feeding_preference) prefParts.push(`feeding: ${prefs.feeding_preference}`);
    if (prefs.vaccine_stance) prefParts.push(`vaccination approach: ${prefs.vaccine_stance}`);
    if (prefs.parenting_style) prefParts.push(`parenting style: ${prefs.parenting_style}`);
    if (prefs.religion) prefParts.push(`faith/spirituality: ${prefs.religion}`);
    if (prefs.dietary_preference) prefParts.push(`dietary preference: ${prefs.dietary_preference}`);
    if (prefs.topics_of_interest?.length) prefParts.push(`interested topics: ${prefs.topics_of_interest.join(", ")}`);

    if (prefParts.length > 0) {
      personalContext = `\n\nUSER PREFERENCES:\n${prefParts.join("\n")}`;
    }
  }

  try {
    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}${childContext}${personalContext}\n\nRELEVANT RESOURCES:\n${resourceContext}`,
      messages: [
        ...priorMessages,
        { role: "user", content: message },
      ],
    });

    const rawMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // ── Parse and strip <<<SOURCES>>> block ─────────────────────────────────
    type ExternalCitation = { index: number; title: string; url: string };
    const externalCitations: ExternalCitation[] = [];
    const sourcesMatch = rawMessage.match(/<<<SOURCES>>>([\s\S]*?)<<<END_SOURCES>>>/);
    let assistantMessage = rawMessage
      .replace(/<<<SOURCES>>>[\s\S]*?<<<END_SOURCES>>>/, "")
      .trim();

    if (sourcesMatch) {
      for (const line of sourcesMatch[1].trim().split("\n")) {
        const m = line.match(/^\[(\d+)\]\s+(.+?):\s+(https?:\/\/\S+)$/);
        if (m) {
          externalCitations.push({ index: parseInt(m[1]), title: m[2].trim(), url: toBaseUrl(m[3].trim()) });
        }
      }
    }

    // ── Parse and strip <<<PREF_UPDATE>>> block ──────────────────────────────
    type PreferenceUpdateSuggestion = { field: string; suggested_value: string; reason: string };
    let preferenceUpdateSuggestion: PreferenceUpdateSuggestion | null = null;
    const prefMatch = assistantMessage.match(/<<<PREF_UPDATE>>>([\s\S]*?)<<<END_PREF_UPDATE>>>/);
    if (prefMatch) {
      try {
        preferenceUpdateSuggestion = JSON.parse(prefMatch[1].trim());
      } catch {
        // malformed JSON — ignore
      }
      assistantMessage = assistantMessage
        .replace(/<<<PREF_UPDATE>>>[\s\S]*?<<<END_PREF_UPDATE>>>/, "")
        .trim();
    }

    const newMessages: ChatMessage[] = [
      ...priorMessages,
      { role: "user", content: message },
      { role: "assistant", content: assistantMessage },
    ];

    const newCitedIds = finalResources?.map((r) => r.id) ?? [];
    let savedConversationId: string | null = null;

    if (existingConversation) {
      // Append to the existing conversation row
      await supabase
        .from("ai_conversations")
        .update({
          messages: newMessages,
          cited_resource_ids: [
            ...new Set([...existingConversation.cited_resource_ids, ...newCitedIds]),
          ],
        })
        .eq("id", existingConversation.id);
      savedConversationId = existingConversation.id;
    } else {
      // Start a new conversation row
      const { data: inserted } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: userId,
          child_id: child_id ?? null,
          messages: newMessages,
          cited_resource_ids: newCitedIds,
        })
        .select("id")
        .single();
      savedConversationId = inserted?.id ?? null;
    }

    const internalCitations = (finalResources ?? []).map((r, i) => ({
      index: i + 1,
      id: r.id,
      title: r.title,
      slug: (r.slug as string | null) ?? null,
      url: null as string | null,
    }));

    res.json({
      message: assistantMessage,
      conversation_id: savedConversationId,
      cited_resources: [
        ...internalCitations,
        ...externalCitations.map((c) => ({ index: c.index, id: null, title: c.title, url: c.url })),
      ],
      preference_update_suggestion: preferenceUpdateSuggestion,
      usage: monthlyLimit !== null
        ? { used: monthlyUsed + 1, limit: monthlyLimit, remaining: Math.max(0, monthlyLimit - monthlyUsed - 1) }
        : null,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});
