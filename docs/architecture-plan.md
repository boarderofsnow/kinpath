# KinPath — Product Architecture Plan

*Evidence-based parenting resources, personalized to your family*

---

## 1. Product Summary

KinPath is a subscription SaaS platform (web + iOS) delivering evidence-based parenting resources from pregnancy through age 5. Content is professionally vetted, automatically adapts to each child's age, and is personalized based on family beliefs, lifestyle, and preferences. Claude API integration fills knowledge gaps with guardrailed, trustworthy answers.

**Key differentiators:**
- Onboarding questionnaire personalizes the entire experience to family values (religion, birth preferences, vaccine stance, lifestyle)
- All resources are professionally vetted with a transparent review process
- Age-adaptive content follows the child automatically — no manual browsing
- Claude-powered Q&A fills gaps beyond the curated resource library
- Zero regulated health information stored (no HIPAA burden)

---

## 2. Tech Stack Overview

Optimized for a solo / 1–2 developer team. Every choice prioritizes managed services, minimal ops overhead, and a single primary language (TypeScript) across the full stack.

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript (everywhere) | One language across web, mobile, API, and scripts |
| **Web App** | Next.js 15 (App Router) | SSR for SEO, API routes for backend, Vercel deployment |
| **iOS App** | React Native + Expo | Shares business logic with web, managed builds via EAS |
| **Backend / BaaS** | Supabase | PostgreSQL + Auth + Row-Level Security + Realtime + Storage |
| **API Layer** | Next.js API Routes + Supabase Edge Functions | Serverless, zero-ops |
| **Payments (Web)** | Stripe | Subscription management, customer portal, webhooks |
| **Payments (iOS)** | RevenueCat | Unifies App Store IAP with Stripe entitlements |
| **AI** | Claude API (Anthropic) | RAG-based Q&A with vetted content as knowledge base |
| **Search** | Supabase pgvector | Vector similarity search for resource recommendations |
| **Email** | Resend or Postmark | Transactional emails (welcome, age milestones, digests) |
| **Analytics** | PostHog (self-hostable) | Product analytics, feature flags, session replay |
| **Hosting** | Vercel (web) + Supabase (backend) + EAS (iOS) | Fully managed |
| **CDN / Media** | Supabase Storage + Vercel Edge | Images, PDFs, video thumbnails |
| **Error Tracking** | Sentry | Crash reporting, performance monitoring, release tracking |
| **Uptime Monitoring** | BetterStack or UptimeRobot | Downtime alerts, status page |

**Estimated monthly cost at launch:** ~$100–250/month (Supabase Pro $25, Vercel Pro $20, Claude API ~$30–100 usage-based, Sentry $26, RevenueCat free tier, Resend free tier, PostHog free tier, BetterStack free tier)

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   ┌──────────────┐         ┌──────────────┐                │
│   │   Next.js    │         │  React Native │                │
│   │   Web App    │         │  iOS (Expo)   │                │
│   │  (Vercel)    │         │  (EAS Build)  │                │
│   └──────┬───────┘         └──────┬────────┘                │
│          │                        │                         │
└──────────┼────────────────────────┼─────────────────────────┘
           │                        │
           ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
│                                                             │
│   ┌──────────────────┐   ┌──────────────────────┐          │
│   │  Next.js API     │   │  Supabase Edge       │          │
│   │  Routes          │   │  Functions           │          │
│   │  (Vercel)        │   │  (Deno Deploy)       │          │
│   └──────┬───────────┘   └──────┬───────────────┘          │
│          │                      │                           │
│          ▼                      ▼                           │
│   ┌─────────────────────────────────────────┐              │
│   │         Supabase (Core Backend)         │              │
│   │                                         │              │
│   │  ┌──────────┐  ┌──────┐  ┌──────────┐  │              │
│   │  │PostgreSQL │  │ Auth │  │ Storage  │  │              │
│   │  │+ pgvector │  │      │  │ (Media)  │  │              │
│   │  └──────────┘  └──────┘  └──────────┘  │              │
│   └─────────────────────────────────────────┘              │
│                                                             │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│                                                             │
│   ┌──────────┐  ┌────────────┐  ┌─────────┐  ┌─────────┐ │
│   │  Stripe  │  │ RevenueCat │  │ Claude  │  │ Resend  │ │
│   │(Web pay) │  │ (iOS IAP)  │  │  API    │  │ (Email) │ │
│   └──────────┘  └────────────┘  └─────────┘  └─────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### Design Principles
- **No PHI/HIPAA data**: We store child date-of-birth for age calculation, parent preferences, and content engagement — nothing clinical
- **Row-Level Security (RLS)**: Supabase RLS policies ensure users can only access their own data
- **Soft deletes**: All user-facing records use `deleted_at` timestamps rather than hard deletes

### Core Entities

```
┌─────────────────────┐       ┌──────────────────────┐
│       users          │       │      children         │
├─────────────────────┤       ├──────────────────────┤
│ id (uuid, PK)       │──┐    │ id (uuid, PK)        │
│ email                │  │    │ user_id (FK → users) │
│ display_name         │  └───▶│ name                 │
│ onboarding_complete  │       │ due_date / dob       │
│ subscription_tier    │       │ is_born (bool)       │
│ stripe_customer_id   │       │ created_at           │
│ rc_customer_id       │       └──────────────────────┘
│ created_at           │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐       ┌──────────────────────────┐
│  user_preferences    │       │     resources            │
├─────────────────────┤       ├──────────────────────────┤
│ id (uuid, PK)       │       │ id (uuid, PK)            │
│ user_id (FK)        │       │ title                    │
│ birth_preference     │       │ slug                     │
│  (home/hospital/    │       │ summary                  │
│   birth_center)     │       │ body (richtext/markdown) │
│ feeding_preference   │       │ resource_type            │
│  (breast/formula/   │       │  (article/checklist/     │
│   combo/undecided)  │       │   video/guide/infographic)│
│ vaccine_stance       │       │ source_url               │
│  (standard/delayed/ │       │ age_start_weeks (int)    │
│   selective/         │       │ age_end_weeks (int)      │
│   hesitant)          │       │ status                   │
│ religion             │       │  (draft/in_review/       │
│ dietary_restrictions │       │   approved/rejected/     │
│ parenting_style      │       │   archived)              │
│ topics_of_interest   │       │ vetted_at                │
│  (text[])           │       │ vetted_by (FK)           │
│ updated_at           │       │ embedding (vector(1536)) │
│                      │       │ created_at               │
└─────────────────────┘       └──────────────────────────┘

┌──────────────────────────┐   ┌──────────────────────────┐
│   resource_topics        │   │  resource_tags            │
├──────────────────────────┤   ├──────────────────────────┤
│ resource_id (FK)         │   │ resource_id (FK)         │
│ topic_id (FK)            │   │ tag_id (FK)              │
│                          │   │                          │
│ Topics:                  │   │ Tags (lifestyle/belief): │
│ - nutrition_and_diet     │   │ - faith:christian        │
│ - vaccinations           │   │ - faith:jewish           │
│ - breastfeeding          │   │ - faith:muslim           │
│ - emotional_wellness     │   │ - faith:secular          │
│ - sleep                  │   │ - birth:home             │
│ - milestones             │   │ - birth:hospital         │
│ - safety                 │   │ - vaccine:standard       │
│ - postpartum             │   │ - vaccine:delayed        │
│ - prenatal               │   │ - diet:vegan             │
│ - infant_care            │   │ - diet:vegetarian        │
│ - toddler_development   │   │ - feeding:breastfeeding  │
│ - relationships          │   │ - feeding:formula        │
└──────────────────────────┘   └──────────────────────────┘

┌──────────────────────────┐   ┌──────────────────────────┐
│   professional_reviews   │   │  ai_conversations        │
├──────────────────────────┤   ├──────────────────────────┤
│ id (uuid, PK)            │   │ id (uuid, PK)            │
│ resource_id (FK)         │   │ user_id (FK)             │
│ reviewer_id (FK)         │   │ child_id (FK, nullable)  │
│ status                   │   │ messages (jsonb)         │
│  (approved/rejected/     │   │ cited_resource_ids       │
│   needs_revision)        │   │  (uuid[], tracks which   │
│ review_notes             │   │   resources were cited)  │
│ credentials_verified     │   │ created_at               │
│ reviewed_at              │   │                          │
└──────────────────────────┘   └──────────────────────────┘

┌──────────────────────────┐   ┌──────────────────────────┐
│   reviewers              │   │   editorial_pins         │
├──────────────────────────┤   ├──────────────────────────┤
│ id (uuid, PK)            │   │ id (uuid, PK)            │
│ user_id (FK → users)     │   │ resource_id (FK)         │
│ full_name                │   │ position (int)           │
│ credentials              │   │ age_week_target (int)    │
│  (MD/RN/IBCLC/RD/etc)   │   │ pinned_at               │
│ specialty                │   │ expires_at (nullable)    │
│ verified (bool)          │   └──────────────────────────┘
│ active (bool)            │
└──────────────────────────┘
                               ┌──────────────────────────┐
┌──────────────────────────┐   │   audit_logs             │
│  resource_review_schedule│   ├──────────────────────────┤
├──────────────────────────┤   │ id (uuid, PK)            │
│ resource_id (FK)         │   │ actor_id (FK → users)    │
│ review_interval_days     │   │ action (text)            │
│  (default: 365)          │   │ entity_type (text)       │
│ last_reviewed_at         │   │ entity_id (uuid)         │
│ next_review_due          │   │ change_delta (jsonb)     │
│ flagged (bool)           │   │ created_at               │
└──────────────────────────┘   └──────────────────────────┘
```

### Age Calculation Logic

Age-adaptive content is the core mechanic. The system calculates the child's age in weeks and filters resources accordingly:

```
// Pseudocode for age-based resource filtering
if (child.is_born) {
  age_in_weeks = weeksBetween(child.dob, today)
} else {
  // Prenatal: calculate gestational age from due date
  gestational_weeks = 40 - weeksBetween(today, child.due_date)
  age_in_weeks = -gestational_weeks  // negative = prenatal
}

// Query: resources WHERE age_start_weeks <= age_in_weeks <= age_end_weeks
```

Prenatal resources use **negative week values** (e.g., -40 to 0 = pregnancy), postnatal use positive (0 to 260 = birth through age 5).

---

## 5. Feature Architecture

### 5.1 Onboarding & Personalization Questionnaire

The questionnaire runs during registration and can be updated anytime from settings. It drives all content personalization.

**Flow:**
1. Sign up (email + password or social OAuth via Supabase Auth)
2. Add child profile(s) — name + due date or DOB
3. Questionnaire (5–8 screens, progress bar, skippable):
   - Birth preference (home / hospital / birth center / undecided)
   - Feeding plans (breastfeeding / formula / combination / undecided)
   - Vaccine approach (standard CDC schedule / delayed / selective / prefer not to say)
   - Religious or spiritual tradition (optional, multi-select)
   - Dietary preferences (omnivore / vegetarian / vegan / kosher / halal / other)
   - Parenting philosophy (attachment / gentle / Montessori / no preference)
   - Topics of most interest (multi-select from topic list)
4. Save to `user_preferences`, immediately personalize the home feed

**Key design choice:** All questionnaire answers are **inclusive filters, not exclusive**. A vaccine-hesitant parent still sees standard-schedule information — it's just presented with sensitivity, not hidden. Resources tagged with their stance appear *first*, and the language/framing is adapted.

### 5.2 Content Management & Professional Vetting

This is the editorial backbone. Content follows a two-track lifecycle — resources can be published without professional review, but vetted resources earn a visible trust badge in the UI.

```
  DRAFT → PUBLISHED (unvetted — no badge)
  DRAFT → IN REVIEW → VETTED ✓ → PUBLISHED (with "Professionally Vetted" badge)
                    ↘ REJECTED (with notes) → revised → back to IN REVIEW
                               ARCHIVED (outdated/superseded)
```

**Two-track publishing model:**
- **Unvetted resources** can be published directly by admins. They appear in the feed without a vetting badge. This allows the content library to scale without being bottlenecked by reviewer availability.
- **Vetted resources** go through professional review and earn a visible "Professionally Vetted" badge in the UI. This badge shows the reviewer's credentials and review date, building trust.
- The vetting badge is a key differentiator — users can filter to show only vetted resources if they prefer.

**Professional review workflow (optional per resource):**
- Reviewers are credentialed professionals (MDs, RNs, IBCLCs, RDs, psychologists) invited by admin
- Reviews are timestamped — vetted resources can be flagged for re-review on a schedule (e.g., annually)
- Rejected resources include reviewer notes and can be revised and resubmitted
- An admin dashboard shows review queue, aging drafts, and resources due for re-review

**UI vetting badge:**
- A small shield/checkmark icon with "Professionally Vetted" text
- On hover/tap: shows reviewer name, credentials, and review date
- Resources without the badge are still published and accessible — just without the trust signal
- Users can toggle a "Show vetted only" filter in settings or on the feed

**Content structure per resource:**
- Title, summary, full body (Markdown with media support)
- Age range (start/end in weeks)
- Topics (one or more from the taxonomy)
- Lifestyle/belief tags (for personalization)
- Source citations (links to studies, guidelines, professional organizations)
- Resource type (article, checklist, video embed, infographic, guide)
- Vetting status: unvetted or vetted (with reviewer attribution and date)

### 5.2b Pregnancy Countdown & Engagement Features

For expecting parents, KinPath provides delightful, stage-aware features that make the pregnancy journey engaging and informative. These features activate automatically when a child profile has a due date but `is_born = false`.

**Baby Size Comparisons:**
- Each gestational week maps to a relatable everyday object (e.g., week 8 = raspberry, week 20 = banana, week 36 = honeydew melon)
- Displayed prominently on the pregnancy dashboard with a cute illustration placeholder
- Updates automatically as weeks progress

**Due Date Countdown:**
- A visual countdown showing weeks and days remaining until the due date
- Milestone markers at key points (end of each trimester, viability milestone, full term)
- Encouraging messages that change weekly

**Stage-Aligned Planning Tips:**
- Practical, timely suggestions based on the current gestational week
- Examples: "Week 12: Great time to start sharing the news!", "Week 28: Start thinking about your birth plan", "Week 36: Pack your hospital bag this week"
- Tips adapt to user preferences (e.g., home birth parents get different prep tips than hospital birth parents)

**Weekly Development Updates:**
- Brief, engaging descriptions of what's happening developmentally each week
- Sourced from vetted medical references (e.g., ACOG guidelines)
- Tied to the resource feed — each week links to relevant deeper-dive resources

### 5.3 Age-Adaptive Home Feed

The primary interface is a personalized feed that automatically updates as the child ages.

**Feed algorithm (priority order):**
1. **Age match** — only show resources within the child's current age window
2. **Preference boost** — resources matching user preferences sort higher
3. **Topic interest** — user's selected topics of interest get priority
4. **Engagement signals** — bookmarked topics, read history patterns
5. **Editorial picks** — admin-pinned resources for critical milestones (e.g., newborn screening week 1, introducing solids around 6 months)
6. **Freshness** — recently published or updated content gets a small boost

**Multiple children:** Users with multiple children see a tabbed or switchable view. Each child has their own age-appropriate feed.

### 5.4 Claude API Integration (AI Assistant)

Claude fills gaps between curated resources — parents can ask questions and get evidence-based answers.

**Architecture:**

```
User Question
      │
      ▼
┌─────────────────────┐
│  Query Processing    │
│  (Edge Function)     │
│                      │
│  1. Embed question   │
│     (pgvector)       │
│  2. Retrieve top-k   │
│     matching         │
│     resources        │
│  3. Build system     │
│     prompt with:     │
│     - User prefs     │
│     - Child age      │
│     - Retrieved      │
│       resource       │
│       excerpts       │
│     - Guardrails     │
│  4. Call Claude API  │
│  5. Return answer    │
│     with citations   │
└─────────────────────┘
```

**System prompt guardrails:**
- Always cite sources (link back to vetted resources when available)
- Never provide medical diagnoses or treatment plans
- Redirect urgent medical concerns to "contact your pediatrician"
- Respect user preferences (e.g., don't advocate for vaccines if user is vaccine-hesitant — present information neutrally)
- Keep responses warm, supportive, and non-judgmental
- Flag when a question falls outside the vetted knowledge base
- Do not store or reference any health data from conversations

**Subscription gating:** Free tier gets limited AI questions per month (e.g., 5). Premium gets unlimited.

### 5.5 Subscription & Payment Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Web User   │    │  iOS User    │    │   Entitlements   │
│              │    │              │    │   Service        │
│  Stripe      │    │ App Store   │    │                  │
│  Checkout    │───▶│  IAP via    │───▶│  RevenueCat      │
│  (web)       │    │  RevenueCat │    │  (single source  │
│              │    │              │    │   of truth)      │
└──────────────┘    └──────────────┘    └──────────────────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │  Supabase    │
                                        │  user.       │
                                        │  subscription│
                                        │  _tier       │
                                        └──────────────┘
```

**Tiers:**

| Feature | Free | Premium ($9.99/mo or $79.99/yr) | Family ($14.99/mo or $99.99/yr) |
|---------|------|------|------|
| Age-adaptive feed | ✓ | ✓ | ✓ |
| Core resources (~30 curated) | ✓ | ✓ | ✓ |
| Full resource library (200+) | — | ✓ | ✓ |
| AI assistant questions | 5/month | Unlimited | Unlimited |
| Milestone checklists | Basic | Detailed + printable | Detailed + printable |
| Bookmarks & notes | — | ✓ | ✓ |
| Multiple child profiles | 1 | Up to 5 | Up to 5 |
| Email milestone digests | — | ✓ | ✓ |
| Partner/co-parent account | — | — | ✓ (invite 1 partner, shared bookmarks) |

**RevenueCat** handles entitlement syncing — whether a user subscribes via Stripe on web or IAP on iOS, their access level syncs to a single `subscription_tier` field in the database via webhooks.

---

## 6. Shared Code Strategy (Web + iOS)

With TypeScript everywhere, significant logic can be shared:

```
/packages
  /shared              ← shared TypeScript package
    /types             ← type definitions (User, Resource, Child, etc.)
    /utils             ← age calculation, preference matching, feed scoring
    /constants         ← topic taxonomy, tag definitions, tier limits
    /validation        ← Zod schemas for forms and API inputs
  /web                 ← Next.js app
    /app               ← App Router pages
    /components        ← React web components
  /mobile              ← Expo React Native app
    /app               ← Expo Router screens
    /components        ← React Native components
  /supabase            ← Supabase config, migrations, edge functions
    /migrations        ← SQL migration files
    /functions         ← Edge Functions (Claude API proxy, webhooks)
    /seed              ← Seed data for topics, tags
```

**Monorepo managed with Turborepo** — shared package changes trigger rebuilds of both web and mobile.

---

## 7. Security & Privacy Architecture

### What We Store (explicitly NOT health data)
- Email, display name, auth credentials (managed by Supabase Auth)
- Child name + DOB/due date (for age calculation only)
- Lifestyle/belief preferences (for personalization)
- Content engagement (bookmarks, read history, AI conversations)
- Subscription status

### What We Never Store
- Medical records, diagnoses, conditions, prescriptions
- Growth charts, weight/height data
- Allergy details, medication lists
- Doctor/provider information
- Any data that would constitute Protected Health Information (PHI)

### Security Measures
- **Supabase Auth** with email + social login (Google, Apple Sign-In)
- **Row-Level Security (RLS)** on all tables — users can only query their own data
- **API key rotation** for Claude API and Stripe keys (stored in environment variables, never client-side)
- **Rate limiting** on AI endpoints to prevent abuse
- **Content Security Policy** headers on web
- **SSL/TLS** everywhere (Vercel and Supabase enforce this)
- **COPPA consideration**: If children could interact with the app directly, COPPA compliance would be needed. Since the app is for *parents* (adults), this is lower risk — but the Terms of Service should state the app is intended for users 18+.

### Backup & Disaster Recovery
- **Database**: Supabase Pro includes automated daily backups. Enable Point-in-Time Recovery (PITR) for granular restore capability (restores to any point within retention window).
- **Content/Media**: Supabase Storage objects are replicated. Additionally, export resource content periodically to a Git repository as Markdown files (serves as both backup and version history).
- **Configuration**: All infrastructure-as-code stored in the monorepo (Supabase migrations, Edge Function source, environment variable templates).
- **Incident Response**: Sentry alerts for errors; BetterStack for downtime detection; PagerDuty or Opsgenie integration when the team grows.

---

## 8. Infrastructure & Deployment

```
GitHub (monorepo)
      │
      ├──► Vercel (auto-deploy on push)
      │      ├── Next.js web app (production)
      │      ├── Preview deployments (per PR)
      │      └── Serverless API routes
      │
      ├──► Supabase (linked project)
      │      ├── Database migrations (via CLI)
      │      ├── Edge Functions (deploy via CLI)
      │      └── Auth, Storage, Realtime
      │
      └──► EAS Build (Expo)
             ├── iOS builds (TestFlight → App Store)
             └── OTA updates (Expo Updates for JS-only changes)
```

**Environment strategy:**
- `main` branch → production
- `develop` branch → staging (Vercel preview + Supabase staging project)
- Feature branches → Vercel preview deployments
- Supabase branching (beta) for database schema previews

---

## 9. Content Taxonomy

### Topics (Primary Categories)

| Topic | Age Range | Description |
|-------|-----------|-------------|
| Prenatal Care | -40w to 0 | Pregnancy health, fetal development, birth prep |
| Newborn Care | 0–12w | Feeding basics, sleep, umbilical care, first visits |
| Infant Development | 12–52w | Milestones, tummy time, introducing solids |
| Toddler Development | 1–3yr | Walking, talking, behavior, toilet training |
| Preschool Readiness | 3–5yr | Social skills, learning, independence |
| Nutrition & Diet | All ages | Age-appropriate nutrition guides |
| Vaccinations | All ages | Schedule info, what to expect, alternatives |
| Breastfeeding & Feeding | 0–2yr | Latching, supply, weaning, bottle feeding |
| Emotional Wellness | All ages | Parental mental health, bonding, postpartum |
| Sleep | All ages | Safe sleep, schedules, regressions, training |
| Safety | All ages | Childproofing, car seats, first aid |
| Relationships | All ages | Co-parenting, partner dynamics, family support |

### Personalization Tags (Belief/Lifestyle Filters)

Tags don't exclude content — they influence sort order and framing. A resource can have multiple tags.

---

## 10. MVP Roadmap

### Phase 1: Foundation (Weeks 1–8)
- Supabase project setup (database schema, RLS policies, auth, backup/PITR configuration)
- Next.js web app scaffold with Turborepo monorepo
- Sentry error tracking + BetterStack uptime monitoring
- User registration + onboarding questionnaire
- Child profile creation (DOB/due date)
- Basic admin panel (resource CRUD, reviewer management, editorial pinning)
- Age-based content filtering on home feed
- Seed initial content (30–50 core resources to unblock testing)

### Phase 2: Content & Personalization (Weeks 9–14)
- Preference-based feed personalization
- Resource detail views with citations
- Bookmark and read-later functionality
- Professional reviewer portal (invite-only, review workflow, review scheduling)
- Expand content library (100+ resources across all major topics and age ranges)
- Audit logging for admin/reviewer actions

### Phase 3: AI & Payments (Weeks 15–20)
- Claude API integration with RAG (pgvector embeddings of vetted resources)
- AI assistant chat interface with guardrails and citation tracking
- Stripe subscription integration (web)
- Free vs. premium tier gating
- Email digest system (weekly milestone emails, bounce/unsubscribe handling)

### Phase 4: iOS & Launch (Weeks 21–26)
- React Native / Expo mobile app (shared logic from monorepo)
- RevenueCat integration (iOS IAP) + entitlement syncing with Stripe
- Push notifications (age milestones, new relevant content)
- App Store submission + TestFlight beta
- Public launch (web + iOS)

### Phase 5: Post-Launch Growth (Ongoing)
- Community features (moderated forums/discussions, optional)
- Partner integrations (pediatric practices, hospitals)
- Content expansion (video content, printable guides)
- Localization (Spanish as first additional language)
- Analytics-driven content gap identification

---

## 11. Key Technical Decisions & Rationale

**Why Supabase over Firebase?**
Relational data (resources ↔ topics ↔ tags ↔ reviews) maps naturally to PostgreSQL. Firebase's document model would require denormalization. Supabase also offers transparent pricing, pgvector for AI embeddings, and the option to self-host later.

**Why Next.js + Expo (not Flutter)?**
TypeScript end-to-end means one language for web, mobile, API, and shared utilities. Flutter would require Dart, splitting the team's focus. Expo's managed workflow means no native build toolchain to maintain.

**Why RevenueCat for payments?**
Apple requires in-app purchase for digital content on iOS. RevenueCat abstracts the complexity of syncing App Store subscriptions with Stripe web subscriptions into a single entitlement system. Without it, you'd build and maintain this syncing logic yourself.

**Why pgvector over a dedicated vector DB?**
For the scale of a curated resource library (thousands, not millions of documents), pgvector in Supabase is more than sufficient. It avoids adding another service (Pinecone, Weaviate) to the stack. If scale demands it later, migration to a dedicated vector DB is straightforward.

**Why Markdown for resource bodies?**
Markdown is portable, renderable on both web and mobile, easy to edit, and convertible to HTML. It avoids the complexity of a WYSIWYG editor while supporting rich formatting, images, and links.

---

## 12. Risk Considerations

| Risk | Mitigation |
|------|-----------|
| **Content liability** | Professional vetting process + clear disclaimers ("not medical advice") + insurance |
| **Sensitive personalization** | Preferences inform sort order, never exclude evidence-based content; legal review of data handling |
| **AI hallucination** | RAG grounded in vetted resources + system prompt guardrails + citations required |
| **App Store rejection** | RevenueCat handles IAP compliance; no external purchase links in iOS app |
| **COPPA compliance** | App targets parents (18+), not children; ToS enforces this |
| **Scale limitations** | Supabase and Vercel scale well for initial growth; architecture supports migration if needed |
| **Single developer risk** | Managed services reduce ops burden; Turborepo monorepo keeps codebase maintainable |

---

*This architecture is designed to get to MVP quickly with a solo developer while remaining extensible as the team and product grow. Every technology choice prioritizes developer productivity, low operational overhead, and the ability to iterate rapidly based on user feedback.*
