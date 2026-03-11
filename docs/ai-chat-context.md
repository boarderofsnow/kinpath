# AI Chat — Context Architecture

> How the `POST /ai/chat` endpoint assembles context before calling the Claude API.
>
> **Source:** `packages/api/src/routes/ai.ts`

---

## Request Flow

```
Mobile / Web App
       │
       │  POST /ai/chat
       │  { message, child_id?, conversation_id? }
       │
       ▼
┌─────────────────────────────────────────────────┐
│  API Server  (packages/api)                     │
│                                                 │
│  1. Auth & rate-limit check                     │
│  2. Fetch child profile       ← children        │
│  3. Fetch user preferences    ← user_preferences │
│  4. Search resources (age-    ← resources        │
│     filtered when possible)                     │
│  5. Assemble system prompt                      │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Claude API  (claude-sonnet-4-5)          │  │
│  │  system: [prompt + context]               │  │
│  │  messages: [{ role: "user", content }]    │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  6. Save conversation         → ai_conversations │
│  7. Return response + cited resources           │
└─────────────────────────────────────────────────┘
       │
       ▼
  App displays response
```

---

## Context Layers

### Layer 1 — Child Profile

| Source table | `public.children` |
|---|---|
| **Query** | `SELECT name, dob, due_date, is_born WHERE id = child_id` |
| **Fallback** | If no `child_id`, fetches ALL children for the user |

**Born child output:**
```
CHILD CONTEXT:
Child's name: Emma
Age: 3 months old (born 2025-11-28)
Developmental stage: newborn
```

**Prenatal child output:**
```
CHILD CONTEXT:
Child's name: Baby Smith
Status: Prenatal — approximately 28 weeks pregnant (due 2026-05-15)
Trimester: third
```

**Developmental stage labels** (based on age in weeks):
| Weeks | Label |
|---|---|
| 0–11 | newborn |
| 12–25 | infant (3-6 months) |
| 26–51 | infant (6-12 months) |
| 52–77 | toddler (12-18 months) |
| 78–103 | toddler (18-24 months) |
| 104–155 | preschooler (2-3 years) |
| 156+ | preschooler (3-5 years) |

---

### Layer 2 — User Preferences

| Source table | `public.user_preferences` |
|---|---|
| **Query** | `SELECT * WHERE user_id = userId` |

**Fields included (when set):**

| Field | Example |
|---|---|
| `birth_preference` | hospital, home, birth_center, undecided |
| `feeding_preference` | breastfeeding, formula, combination, undecided |
| `vaccine_stance` | standard, delayed, selective, hesitant |
| `parenting_style` | attachment, gentle, montessori, rie |
| `religion` | free text |
| `dietary_preference` | omnivore, vegetarian, vegan, kosher, halal |
| `topics_of_interest` | array — e.g. sleep_training, nutrition_and_diet |

**Output:**
```
USER PREFERENCES:
birth preference: hospital
feeding: breastfeeding
vaccination approach: standard
parenting style: gentle
dietary preference: omnivore
interested topics: sleep_training, developmental_milestones
```

---

### Layer 3 — Relevant Resources

| Source table | `public.resources` |
|---|---|
| **Query** | Full-text search on `title` using first 5 words of message |
| **Age filter** | `age_start_weeks <= childAge + 4 AND age_end_weeks >= childAge - 4` |
| **Fallback** | If age-filtered returns 0 results, re-queries without age filter |
| **Limit** | 5 resources max |

Each resource is formatted as:
```
[1] Resource Title
Resource summary

First 500 characters of body...
```

---

## System Prompt Assembly

The final `system` parameter sent to Claude is assembled in this order:

```
┌──────────────────────────────────────────┐
│  SYSTEM_PROMPT (static rules & persona)  │   ← always present
├──────────────────────────────────────────┤
│  CHILD CONTEXT                           │   ← when child data exists
├──────────────────────────────────────────┤
│  USER PREFERENCES                        │   ← when preferences exist
├──────────────────────────────────────────┤
│  RELEVANT RESOURCES                      │   ← always present (may be empty)
│  [1] Title / summary / body excerpt      │
│  [2] ...                                 │
└──────────────────────────────────────────┘
```

**Code (line 226):**
```typescript
system: `${SYSTEM_PROMPT}${childContext}${personalContext}\n\nRELEVANT RESOURCES:\n${resourceContext}`
```

---

## Example — Full Assembled Prompt

For a user asking *"What milestones should I expect?"* with a 3-month-old named Emma:

```
You are KinPath AI, a warm and supportive parenting assistant.

RULES:
- Always ground your answers in the provided resource excerpts when available
- When referencing a resource, cite it using a bracketed number like [1], [2]
- Never provide medical diagnoses or treatment plans
- For urgent medical concerns, always recommend contacting a pediatrician
- Be warm, supportive, and non-judgmental regardless of parenting choices
- Respect the user's stated preferences — present information neutrally
- If a question falls outside your vetted knowledge, say so honestly
- Never store, request, or reference protected health information
- Keep responses concise but thorough (aim for 2-4 paragraphs)
- Use markdown formatting for emphasis, bullet lists, numbered lists
- IMPORTANT: When child context is provided, always tailor your answer
  to the child's specific age and developmental stage.

CHILD CONTEXT:
Child's name: Emma
Age: 3 months old (born 2025-11-28)
Developmental stage: newborn

USER PREFERENCES:
feeding: breastfeeding
vaccination approach: standard
parenting style: gentle
interested topics: developmental_milestones, sleep_training

RELEVANT RESOURCES:
[1] 3-Month Developmental Milestones
Your baby is growing fast! By 3 months, most babies can hold their
head up, push up during tummy time, and start to grasp objects...

---

[2] Tummy Time Guide for 0-6 Months
Tummy time is essential for building neck and shoulder strength...
```

---

## Conversation Storage

After the AI responds, the full exchange is saved:

| Field | Value |
|---|---|
| `user_id` | Authenticated user |
| `child_id` | Selected child (or null) |
| `messages` | `[{ role: "user", content }, { role: "assistant", content }]` |
| `cited_resource_ids` | Array of resource UUIDs returned in the search |

**Table:** `public.ai_conversations`
