# Consumer Insights Survey — Typeform Implementation Guide

**Audience:** Expecting & new mothers (baby under 6 months)
**Length:** 23 questions · 8–10 minutes · Logic branching enabled
**Date:** February 2026

---

## How to Read This Document

| Element | Meaning |
|---|---|
| `TYPE` | The Typeform block type to select from the + Add block menu |
| ✱ Required | Mark as Required in Typeform's question settings |
| ⤷ Logic Jump | Set in Typeform's Logic tab — exact condition and destination given |
| 💡 Tip | Implementation note specific to Typeform's builder |

---

## Form Flow Overview

| Block | Screen / Question | Typeform Type | Logic Jump |
|---|---|---|---|
| Welcome | Opening screen | Welcome Screen | — |
| Q1 | How far along are you? | Multiple Choice | If 'Recently gave birth' → jump to Q1b |
| Q1b | [New moms only] How old is your baby? | Multiple Choice | Always → rejoin at Q2 |
| Q2 | Is this your first pregnancy? | Multiple Choice | — |
| Q3 | How you find parenting info | Multiple Choice | — |
| *Statement* | *Transition: Pain Points* | *Statement* | — |
| Q4 | Hardest part of finding info | Long Text | — |
| Q5 | How often conflicting advice? | Opinion Scale (1–4) | If score ≥ 3 → show Q6; else skip to Q7 |
| Q6 | How conflicting info makes you feel | Long Text | Always → Q7 |
| Q7 | Decision you second-guessed | Long Text | — |
| *Statement* | *Transition: Sources & Trust* | *Statement* | — |
| Q8 | Where you get info (multi-select) | Multiple Choice (multi) | — |
| Q9 | Most trusted source and why | Long Text | — |
| Q10 | Expert vs. parent experience | Opinion Scale (1–5) | — |
| Q11a | Have you paid for an app before? | Yes / No | If No → skip Q11b |
| Q11b | Which app? What did you think? | Long Text | Always → Q12 |
| *Statement* | *Transition: Features* | *Statement* | — |
| Q12 | Topics you search most (top 5) | Multiple Choice (multi) | — |
| Q13 | The perfect parenting resource | Long Text | — |
| Q14 | Feature value rating | Rating (per feature) | — |
| Q15 | Respects your values | Opinion Scale (1–5) | — |
| Q16 | Partner / co-parent access | Long Text | — |
| *Statement* | *Transition: Timing* | *Statement* | — |
| Q17 | When you look up info (multi) | Multiple Choice (multi) | — |
| Q18 | Preferred delivery format (rank) | Ranking | — |
| Q19 | Time per week on a resource | Multiple Choice | — |
| *Statement* | *Transition: Pricing* | *Statement* | — |
| Q20 | Expected monthly price | Number | — |
| Q21 | What would make you cancel | Long Text | — |
| Q22 | Free tier interest | Opinion Scale (1–5) | — |
| *Statement* | *Transition: Final question* | *Statement* | — |
| Q23 | One thing that would reduce stress | Long Text | — |
| Q24 | Email for launch notification | Email | optional |
| Thank You | Closing screen | Thank You Screen | — |

---

## Welcome Screen

**Title:** "Quick question — would you share your honest take?"

**Description:**
> We're building a personalized parenting resource for expecting and new parents — and we want to make sure we're solving the right problems.
>
> This takes about 8–10 minutes. All responses are anonymous. There are no right or wrong answers — just your honest experience.

**Button label:** "Let's do it"

💡 *Tip: In Typeform's Design tab, set primary color to `#10B89F`. Upload a calm, warm cover photo. Button text helps set a conversational tone.*

---

## Section 1 — About You

---

### Q1 · Multiple Choice · ✱ Required

**How far along are you in your pregnancy?**

- First trimester (weeks 1–12)
- Second trimester (weeks 13–26)
- Third trimester (weeks 27–40)
- I've recently given birth (within the last 6 months)

⤷ **Logic Jump:** If "I've recently given birth" → jump to **Q1b**. All other answers → continue to **Q2**.

---

### Q1b · Multiple Choice · ✱ Required *(new moms only)*

**How old is your baby?**

- Less than 4 weeks
- 1–3 months
- 3–6 months

⤷ **Logic Jump:** Always → jump to **Q2** (rejoins main path).

💡 *Tip: Q1b is shown only to respondents who selected "recently gave birth" in Q1. Set the logic jump from Q1b to Q2 so it rejoins the main flow.*

---

### Q2 · Multiple Choice · ✱ Required

**Is this your first pregnancy?**

- Yes, this is my first
- No, I have one other child
- No, I have two or more other children

---

### Q3 · Multiple Choice · ✱ Required

**How would you describe your approach to finding parenting information?**

- I research everything thoroughly
- I look things up as specific questions come up
- I mostly rely on advice from people I trust
- I feel overwhelmed and don't know where to start

---

## Section 2 — Current Pain Points

> *Statement card:* "Now for the important stuff — tell us what actually frustrates you about finding parenting information today. Be as specific as you'd like. There are no wrong answers."

---

### Q4 · Long Text · ✱ Required

**What's the single hardest part about finding reliable parenting information right now?**

💡 *Tip: Responses to Q4 will be your most quotable insights for product positioning.*

---

### Q5 · Opinion Scale (1–4) · ✱ Required

**How often do you encounter conflicting advice from different sources?**

| 1 | 2 | 3 | 4 |
|---|---|---|---|
| Rarely | Sometimes | Frequently | Constantly — every source says something different |

⤷ **Logic Jump:** If score ≥ 3 → show **Q6**. If score ≤ 2 → skip to **Q7**.

💡 *Tip: Use an Opinion Scale 1–4. Add end labels "Rarely" and "Constantly." Set the logic jump in the Logic tab: answer ≥ 3 → Q6; else → Q7.*

---

### Q6 · Long Text · optional *(shown only for high-conflict respondents)*

**When you get conflicting information, how does that make you feel?**

⤷ **Logic Jump:** Always → continue to **Q7**.

---

### Q7 · Long Text · optional

**Have you ever made a parenting decision you later second-guessed because of something you read online? What happened?**

💡 *Tip: Responses here often contain powerful marketing copy — they reveal real consequences of misinformation.*

---

## Section 3 — Information Sources & Trust

> *Statement card:* "Let's talk about where you actually go for information — and how much you trust what you find."

---

### Q8 · Multiple Choice (allow multiple) · ✱ Required

**Where do you currently go for pregnancy and parenting information? Select all that apply.**

- OB-GYN or midwife
- Pediatrician
- Family and friends
- Instagram or TikTok
- Parenting apps (What to Expect, The Bump, BabyCenter, etc.)
- Google search
- Books
- Reddit or online forums
- Facebook groups
- Podcasts
- Other (please specify)

💡 *Tip: Enable "Multiple Selections." Add "Other" as a free-text option using Typeform's built-in Other checkbox in choice settings.*

---

### Q9 · Long Text · optional

**Which of those sources do you trust the most, and why?**

---

### Q10 · Opinion Scale (1–5) · ✱ Required

**How important is it that parenting information comes from a recognized expert or institution versus another parent's lived experience?**

| 1 | 3 | 5 |
|---|---|---|
| I strongly prefer expert / institutional sources | I value both equally | I strongly prefer other parents' real experiences |

💡 *Tip: Set label at 1 = "Trust experts most" and label at 5 = "Trust real parents most."*

---

### Q11a · Yes / No · ✱ Required

**Have you ever paid for a parenting app, course, or subscription?**

⤷ **Logic Jump:** If "No" → skip **Q11b** and jump to **Q12**. If "Yes" → continue to **Q11b**.

---

### Q11b · Long Text · optional *(shown only for "Yes" respondents)*

**Which one(s), and what did you think of the experience?**

⤷ **Logic Jump:** Always → continue to **Q12**.

---

## Section 4 — Content & Feature Needs

> *Statement card:* "You're halfway through! This section helps us figure out what content and features would actually make your life easier."

---

### Q12 · Multiple Choice (allow multiple, max 5) · ✱ Required

**Which topics do you find yourself searching for most? Select your top 5.**

- Fetal development week by week
- Nutrition during pregnancy
- Labor and delivery preparation
- Newborn care basics
- Sleep (baby and yours)
- Breastfeeding and feeding
- Postpartum mental health
- Relationship changes after baby
- Financial planning for a growing family
- Childproofing and safety
- Developmental milestones
- Vaccines and immunizations
- Returning to work / childcare

💡 *Tip: Enable "Multiple Selections." Add the description "Pick your top 5." Strict max-selection enforcement is available on Business tier via Logic variables; on lower plans, rely on the description prompt.*

---

### Q13 · Long Text · ✱ Required

**When you imagine the "perfect" parenting resource, what does it do that nothing currently does?**

💡 *Tip: This is your most strategically important question. Responses directly inform your positioning and feature roadmap.*

---

### Q14 · Rating (one per feature) · ✱ Required

**How valuable would each of these features be to you?**

Rate each from **1 (Not valuable) → 5 (Extremely valuable)**:

1. Content that updates automatically as your baby grows
2. An AI assistant you can ask parenting questions anytime
3. Personalized recommendations based on your values
4. Weekly email digests for your current stage
5. Shared access with a partner or co-parent
6. Checklists and planning tools (hospital bag, milestones, etc.)
7. Community / forum with parents at the same stage

💡 *Tip: Add one Rating block per feature. Label each block clearly. Alternatively, use the Matrix question type if available on your plan.*

---

### Q15 · Opinion Scale (1–5) · ✱ Required

**How important is it that a parenting resource respects your personal values without judgment — around things like feeding choices, vaccination approach, or spiritual beliefs?**

| 1 | 3 | 5 |
|---|---|---|
| Not important at all | Somewhat important | Extremely important — this would be a dealbreaker |

---

### Q16 · Long Text · optional

**Would you want your partner or co-parent to have access to the same resource? What would make it useful for both of you?**

---

## Section 5 — Timing & Delivery

> *Statement card:* "A few quick questions about when and how you like to consume information."

---

### Q17 · Multiple Choice (allow multiple) · ✱ Required

**When do you most often look up parenting information? Select all that apply.**

- When a specific worry or question comes up
- Browsing casually when I have free time
- After a doctor's appointment, to follow up on what was discussed
- Late at night when I can't sleep
- On a regular routine (e.g., weekly)

---

### Q18 · Ranking · ✱ Required

**How would you prefer to receive parenting guidance? Rank in order of preference — 1st = most preferred.**

- App on my phone
- Website on my computer
- Email digest
- Text / SMS notifications
- Push notifications
- Physical book or printout

💡 *Tip: Typeform supports a native Ranking question type on Growth/Business plans. On Starter, replace with a Multiple Choice (multi) asking "Select your top 3 preferred formats."*

---

### Q19 · Multiple Choice · ✱ Required

**How much time per week would you realistically spend on a parenting resource?**

- Less than 15 minutes
- 15–30 minutes
- 30–60 minutes
- More than 1 hour

---

## Section 6 — Pricing & Value

> *Statement card:* "Almost done! A few questions about what this kind of resource would be worth to you."

---

### Q20 · Number · ✱ Required

**If a service gave you personalized, evidence-based parenting guidance that adapted to your child's age — with expert content, an AI assistant, and planning tools — what would you expect to pay per month?**

*(Enter a dollar amount)*

💡 *Tip: Use a Number block. Do not set a placeholder or anchor number — this is intentionally open-ended to capture unanchored willingness to pay.*

---

### Q21 · Long Text · optional

**What would make you cancel a parenting subscription?**

---

### Q22 · Opinion Scale (1–5) · ✱ Required

**Would a free tier with limited access encourage you to try a product like this before committing to a paid plan?**

| 1 | 3 | 5 |
|---|---|---|
| Definitely not — I'd rather see pricing upfront | Maybe — depends on what's included | Definitely yes — I always try before I buy |

---

## Section 7 — One Last Thing

> *Statement card:* "This is the most important question in the whole survey. Take as much space as you need."

---

### Q23 · Long Text · ✱ Required

**If you could have one thing that would make you feel more confident and less stressed as a new parent, what would it be?**

💡 *Tip: Consider adding the placeholder: "It can be anything — a product, a person, a feeling, a piece of information…"*

---

### Q24 · Email · optional

**Would you like to be notified when this launches? Drop your email below.**

*(We'll only send one email when we launch. No newsletters, no spam.)*

⤷ **Logic Jump:** Always → Thank You screen.

---

## Thank You Screen

**Title:** "Thank you — this genuinely helps."

**Description:**
> Your answers will directly shape what we build. We're working hard to create something that makes the parenting journey less stressful — and responses like yours are the reason we'll get it right.

**Button label (optional):** "Share with another expecting parent"

---

## Setup Checklist

### Design
- [ ] Set primary color to `#10B89F` in the Design tab
- [ ] Upload a warm, authentic cover photo for the welcome screen (no branding needed yet)
- [ ] Choose a clean sans-serif font (Typeform's Helvetica default works well)
- [ ] Set button text to "OK" for a conversational feel

### Logic Jumps Summary

| Question | Condition | Destination |
|---|---|---|
| Q1 | Answer = "recently gave birth" | → Q1b (new-mom detour) |
| Q1 | Any other answer | → Q2 (skip Q1b) |
| Q1b | Any answer | → Q2 (rejoin main flow) |
| Q5 | Score ≥ 3 (Frequently / Constantly) | → Q6 (emotional follow-up) |
| Q5 | Score ≤ 2 (Rarely / Sometimes) | → Q7 (skip Q6) |
| Q11a | Answer = "No" | → Q12 (skip Q11b) |
| Q11a | Answer = "Yes" | → Q11b (paid-app follow-up) |
| Q11b | Any answer | → Q12 (rejoin) |

### Required Questions
`Q1` `Q1b` `Q2` `Q3` `Q4` `Q5` `Q8` `Q10` `Q12` `Q13` `Q14` `Q15` `Q17` `Q18` `Q19` `Q20` `Q22` `Q23`

### Optional Questions
`Q6` `Q7` `Q9` `Q11b` `Q16` `Q21` `Q24`

### Distribution Tracking
- Add a **Hidden Field** named `source` to your Typeform URL (e.g., `?source=reddit_pregnant`)
- Create a unique share link per channel so you can identify which community drove the best responses

| Channel | Source tag |
|---|---|
| r/pregnant | `?source=reddit_pregnant` |
| r/beyondthebump | `?source=reddit_bbb` |
| r/BabyBumps | `?source=reddit_babybumps` |
| Facebook group | `?source=fb_[group_name]` |
| BabyCenter | `?source=babycenter` |
| Respondent.io / paid panel | `?source=respondent` |
| Direct / personal | `?source=direct` |

### High-Signal Questions to Watch

| Question | Why it matters |
|---|---|
| **Q4** | Core pain point — what your product must solve |
| **Q7** | Consequences of bad info — powerful for marketing copy |
| **Q13** | What's missing in the market — direct feature roadmap input |
| **Q23** | The emotional need — where your brand positioning lives |

---

*Target: n=50 responses minimum before drawing conclusions. n=100 for reliable pricing and feature data.*
