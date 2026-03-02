# KinPath Tag Taxonomy — Comprehensive Design Document

## Target Audience

Expecting parents, current parents, and anyone seeking information on pregnancy, childbirth, and raising children from conception through adolescence. The app is parent-facing — the taxonomy must reflect how real parents think about and search for information, not just how medical literature is categorized.

---

## Design Principles

1. **Tag the question, not just the article.** Every tag should map to something a parent might actually ask about. If a parent would never search for it, it shouldn't be a standalone tag.
2. **Multi-dimensional.** Every article gets tagged across multiple axes simultaneously — life stage, topic, condition, intent, approach preference, care level. The intersection of these dimensions is what makes retrieval precise.
3. **Respect preferences without prescribing.** Parents have strong preferences about birth, feeding, discipline, and medical intervention. The system should surface evidence-based information that's relevant to their choices, not push a single approach.
4. **Evidence always visible.** Every result the chatbot cites should carry an evidence quality signal so parents can weigh the information accordingly.
5. **Synopsize, don't diagnose.** The chatbot distills clinical/research papers into plain language with citations. It never provides medical advice — it summarizes what the research says and points parents to original sources and their provider.

---

## Proposed Taxonomy (9 dimensions, ~230 tags)

---

### Dimension 1: Life Stage (22 tags) — WHO IS THIS ABOUT?

The full timeline from pre-conception through adolescence, with fine-grained sub-stages that match how parents experience each phase.

```
CONCEPTION & PREGNANCY
  pre-conception              Fertility, preparing for pregnancy, genetic counseling
  pregnancy                   General pregnancy (parent of trimester tags)
    ├── first-trimester       Weeks 1-13, early symptoms, first appointments
    ├── second-trimester      Weeks 14-27, anatomy scan, quickening
    ├── third-trimester       Weeks 28-40, birth prep, nesting
    └── high-risk-pregnancy   Multiples, AMA, complications requiring monitoring
  labor-delivery              Active labor, birth, immediate postpartum

POSTPARTUM & RECOVERY
  postpartum                  General postpartum (parent tag)
    ├── postpartum-recovery   Physical healing, C-section recovery, pelvic floor
    └── fourth-trimester      First 3 months adjustment, baby blues, bonding

BABY & CHILD
  newborn                     0-28 days
  infant                      1-12 months
  toddler                     1-3 years
  preschool                   3-5 years
  school-age                  5-12 years
  tween                       10-13 years (bridge stage: puberty, social shift)
  adolescent                  13-18 years

PARENT / FAMILY
  maternal-health             Mother's health not tied to a specific child stage
  paternal-health             Father/partner health, involvement, adjustment
  family-system               Sibling dynamics, co-parenting, blended families
  caregiver-wellness          Burnout, self-care, mental load, support systems
```

### Dimension 2: Topic (42 tags) — WHAT SUBJECT AREA?

Granular enough that each tag maps to a distinct type of parent question.

```
FEEDING & NUTRITION
  breastfeeding               Latch, supply, pumping, weaning, nursing positions
  formula-feeding             Formula selection, preparation, combination feeding
  pumping                     Exclusive pumping, pump selection, storage, supply
  solids-introduction         Baby-led weaning, purees, first foods, allergen intro
  maternal-nutrition          Prenatal vitamins, pregnancy diet, foods to avoid
  pediatric-nutrition         Toddler/child diet, picky eating, meal planning
  feeding-difficulties        Tongue tie, lip tie, feeding aversion, failure to thrive

SLEEP
  sleep-safety                SIDS prevention, safe sleep position, co-sleeping risks
  sleep-training              Methods, schedules, regressions, night weaning
  sleep-environment           Room setup, white noise, temperature, room-sharing

DEVELOPMENT
  gross-motor                 Rolling, crawling, walking, running, sports skills
  fine-motor                  Grasping, drawing, writing, tool use
  cognitive-development       Problem-solving, memory, attention, executive function
  speech-language             First words, language delay, communication, stuttering
  social-emotional            Attachment, temperament, emotional regulation, empathy
  adaptive-skills             Self-feeding, dressing, toileting, hygiene, independence
  developmental-screening     ASQ-3, M-CHAT-R, Denver II, Bayley-4, milestones

BEHAVIOR
  behavioral-health           ADHD, autism spectrum, conduct, sensory processing
  tantrums-discipline         Meltdowns, limit-setting, consequences, positive discipline
  potty-training              Readiness signs, methods, regression
  school-readiness            Pre-academic skills, kindergarten prep, learning differences
  screen-time                 Media guidelines, digital wellness, age-appropriate content

PHYSICAL HEALTH
  vaccinations                Schedules, safety, catch-up, exemptions
  dental-health               Teething, first dental visit, fluoride, thumb sucking
  skin-care                   Eczema, diaper rash, cradle cap, sun protection
  growth-monitoring           Percentiles, growth charts, failure to thrive, obesity
  vision-hearing              Newborn screening, eye exams, ear infections, tubes
  exercise-activity           Tummy time, active play, sports safety, injury prevention

MENTAL HEALTH & WELLNESS
  perinatal-mood-disorders    PPD, PPA, postpartum OCD, postpartum psychosis, PTSD
  prenatal-mental-health      Depression/anxiety during pregnancy, prenatal bonding
  paternal-mental-health      Dad's depression, anxiety, adjustment, bonding
  infant-mental-health        Attachment disorders, regulatory disorders, early trauma
  child-mental-health         Anxiety, depression, OCD, self-harm, school refusal
  adolescent-mental-health    Identity, mood disorders, eating disorders, substance use
  grief-loss                  Miscarriage, stillbirth, infant loss, pregnancy after loss
  relationship-wellness       Partner communication, intimacy changes, co-parenting

PREGNANCY-SPECIFIC
  prenatal-care               Appointments, tests, what to expect at each visit
  fetal-development           Week-by-week development, ultrasound findings
  birth-planning              Birth plans, birth classes, choosing a provider

SAFETY & ENVIRONMENT
  injury-prevention           Childproofing, car seats, water safety, poison control
  environmental-health        Toxins, lead, household chemicals, air quality, plastics

PRACTICAL & LIFESTYLE
  childcare                   Daycare, nannies, choosing a provider, separation anxiety
  travel                      Traveling with baby/kids, car trips, flying, vaccines for travel
  education-schooling         School choice, IEPs, learning support, homeschool
```

### Dimension 3: Condition / Concern (45 tags) — WHAT SPECIFIC MEDICAL ISSUE?

The conditions parents most commonly worry about or search for, expanded significantly to cover the full range of questions the chatbot will receive.

```
MATERNAL CONDITIONS — PREGNANCY
  gestational-diabetes        GDM screening, management, diet, insulin
  preeclampsia                High BP in pregnancy, HELLP, eclampsia
  placenta-disorders          Previa, accreta, abruption
  hyperemesis                 Severe morning sickness, HG management
  pregnancy-complications     Ectopic, molar, cervical insufficiency, PPROM
  cholestasis                 Intrahepatic cholestasis, itching, bile acids
  gestational-hypertension    Chronic HTN in pregnancy, monitoring, meds
  morning-sickness            Nausea/vomiting (non-HG), remedies, diet tips
  iugr-growth-restriction     Intrauterine growth restriction, monitoring, delivery timing

MATERNAL CONDITIONS — POSTPARTUM
  postpartum-hemorrhage       PPH risk, prevention, management
  postpartum-infection        Endometritis, wound infection, mastitis
  pelvic-floor-dysfunction    Incontinence, prolapse, diastasis recti, PT

NEWBORN/INFANT CONDITIONS
  jaundice                    Newborn jaundice, phototherapy, bilirubin levels
  reflux-colic                Spit-up, GERD, colic, fussiness, comfort holds
  tongue-lip-tie              Diagnosis, impact on feeding, frenotomy
  nicu-prematurity            Preterm birth, NICU care, developmental follow-up
  congenital-conditions       Heart defects, structural anomalies, chromosomal
  newborn-skin                Cradle cap, baby acne, milia, birthmarks, erythema toxicum
  umbilical-cord-issues       Cord care, omphalitis, granuloma, hernia
  plagiocephaly               Flat head, torticollis, helmet therapy, tummy time
  hip-dysplasia               DDH screening, Pavlik harness, swaddling safety

CHILDHOOD CONDITIONS — ACUTE
  allergies-asthma            Food allergies, environmental, anaphylaxis, asthma
  infectious-disease          RSV, flu, COVID, strep, croup, HFM, bronchiolitis
  fever-illness               When to call doctor, fever management, common illnesses
  ear-infections              Otitis media, tubes, hearing impact, recurrence
  rashes-skin-conditions      Eczema flares, hives, molluscum, ringworm, impetigo
  gi-issues                   Constipation, diarrhea, vomiting, stomach bugs, intussusception
  uti-infections              UTI in children, symptoms, recurrence, imaging

CHILDHOOD CONDITIONS — CHRONIC
  chronic-conditions          Diabetes type 1, epilepsy, juvenile arthritis, sickle cell, CF
  genetic-screening           NIPT, carrier screening, newborn screening, chromosomal

CHILDHOOD CONDITIONS — DEVELOPMENTAL / NEURODEVELOPMENTAL
  autism-spectrum             ASD screening, diagnosis, support, therapies
  adhd                        Attention/hyperactivity, diagnosis, treatment, school support
  learning-disabilities       Dyslexia, dyscalculia, dysgraphia, processing disorders
  sensory-processing          SPD, sensory seeking/avoiding, OT support
  speech-delay                Language delay, apraxia, stuttering, articulation
  cerebral-palsy              Motor differences, tone, therapy, adaptive equipment
  down-syndrome               Trisomy 21, health monitoring, early intervention
  intellectual-disability     Developmental delay, adaptive functioning, support

CROSS-CUTTING
  pain-management             Labor pain, pediatric pain, procedural comfort
  disability-special-needs    Adaptive equipment, IEP/504, therapy access, advocacy
  emergency-first-aid         Choking, CPR, when to go to ER, allergic reactions
  surgery-procedures          Circumcision, ear tubes, tonsils, prenatal procedures
  mental-health-crisis        Suicidal ideation, self-harm, psychiatric emergency
```

### Dimension 4: Clinical Intent (8 tags) — WHAT KIND OF ANSWER?

This is the single highest-impact dimension for RAG. It tells the chatbot whether an article answers "what is it," "how do I prevent it," "how do I treat it," or "what should I expect." Two new tags added for the chatbot's summarization and safety roles.

```
prevention           How to reduce risk or avoid a problem
screening            Tests, tools, when to screen, who to screen
diagnosis            Confirming a condition, differential, interpreting results
treatment            Management, medication, therapy, interventions
monitoring           Tracking progress, follow-up, ongoing assessment
what-to-expect       Normal progression, timelines, anticipatory guidance
decision-support     Comparing options, pros/cons, informed choice
safety-guidance      When to call 911, red flags, urgent action steps
```

**Tagging examples:**

- "Management of gestational diabetes with diet" → `gestational-diabetes` + `treatment`
- "ASQ-3 developmental screening at 18 months" → `developmental-screening` + `screening` + `toddler`
- "Week 20: what's happening with your baby" → `fetal-development` + `second-trimester` + `what-to-expect`
- "When to go to the ER for infant fever" → `fever-illness` + `infant` + `safety-guidance`
- "Epidural vs natural birth: what the evidence says" → `labor-delivery` + `pain-management` + `decision-support`

### Dimension 5: Approach / Preference (28 tags) — WHAT PHILOSOPHY?

Parents have strong, personal preferences. These tags let the chatbot respect those preferences and surface relevant evidence without judgment. Articles can be tagged with multiple approaches if they compare them.

```
BIRTH APPROACH
  natural-unmedicated        Physiologic birth, no epidural, minimal intervention
  water-birth                Labor/delivery in water, tub birth
  home-birth                 Planned home birth, out-of-hospital
  birth-center               Freestanding or attached birth center
  hospital-birth             Standard hospital delivery
  medicated-birth            Epidural, pain medication, planned interventions
  cesarean-birth             Planned C-section, gentle cesarean
  vbac                       Vaginal birth after cesarean
  midwifery-model            Midwife-led care, CNM, CPM
  doula-supported            Continuous doula support during labor
  hypnobirthing              Self-hypnosis, relaxation techniques for birth
  bradley-method             Husband-coached natural childbirth
  lamaze                     Breathing and positioning techniques

FEEDING APPROACH
  exclusive-breastfeeding    EBF advocacy and support
  exclusive-pumping          EP, pump schedules, supply, storage
  combination-feeding        Breast + formula, supplementation
  exclusive-formula          Formula-first families, by choice or necessity
  baby-led-weaning           Self-feeding, whole foods, no purees
  traditional-weaning        Spoon-fed purees, gradual progression

PARENTING APPROACH
  attachment-parenting       Co-sleeping, baby-wearing, responsive parenting
  gentle-parenting           Positive discipline, emotion coaching, no punishment
  montessori-parenting       Prepared environment, independence, child-led
  rie-parenting              Respectful observation, minimal intervention
  structured-parenting       Schedules, sleep training, routine-based
  free-range-parenting       Age-appropriate independence, risk tolerance

MEDICAL APPROACH
  conventional-medicine      Standard care, AAP/ACOG guidelines
  integrative-complementary  Chiropractic, acupuncture, herbal, alongside conventional
  minimal-intervention       Selective vaccination, fewer medical procedures
```

**Critical design note:** These tags are NOT about promoting one approach over another. They exist so the chatbot can say "based on your preference for natural birth, here's what the evidence shows about..." instead of giving generic advice. All responses should still be evidence-grounded. The `conventional-medicine` tag is the default when no preference is stated.

### Dimension 6: Care Level (5 tags) — HOW URGENT?

Helps the chatbot triage and escalate appropriately. When a parent asks about something that could be an emergency, the system should prioritize `emergency` and `urgent-care` tagged articles and include appropriate disclaimers.

```
emergency                Call 911 / go to ER now (choking, seizures, severe bleeding)
urgent-care              See doctor within 24h (high fever in infant, dehydration, head injury)
routine-medical          Schedule an appointment (well visits, non-urgent symptoms)
self-care                Can be managed at home (common cold, minor rash, teething)
wellness                 General health optimization, no active concern
```

### Dimension 7: Evidence Level (7 tags) — HOW RELIABLE?

Essential for ranking search results in the chatbot. Keep as-is.

```
systematic-review        Meta-analyses, Cochrane reviews (strongest)
rct                      Randomized controlled trials
cohort-study             Prospective/longitudinal studies
case-control             Retrospective comparative studies
clinical-guidelines      ACOG, AAP, WHO practice guidelines
case-report              Individual case descriptions
expert-opinion           Editorials, commentary (weakest standalone)
```

**RAG ranking rule:** When multiple articles match a query, return them in this order. Always prefer clinical guidelines and systematic reviews for parent-facing responses.

### Dimension 8: Audience (3 tags) — LANGUAGE LEVEL

```
parent-friendly          Written for/accessible to parents (plain language)
clinical                 Written for healthcare providers (medical terminology)
research                 Academic audience (methodology-focused, statistical)
```

**RAG rule:** Default to `parent-friendly` + `clinical-guidelines`. Only surface `clinical` or `research` articles if the parent-friendly pool is too small for the query, and have the chatbot translate the language.

### Dimension 9: Cultural / Religious Consideration (8 tags) — CONTEXT-SENSITIVE

Some medical decisions intersect with cultural or religious beliefs. These tags help the chatbot surface relevant information respectfully.

```
faith-based-perspective   Articles discussing intersection of faith and medical decisions
cultural-birth-practice   Traditional birth customs, cultural postpartum practices
cultural-feeding          Cultural approaches to infant/child feeding
circumcision-decision     Medical evidence and cultural/religious context
end-of-life-decisions     Perinatal palliative care, comfort care, NICU withdrawal
fertility-ethics          IVF, surrogacy, egg/sperm donation ethical dimensions
vaccine-hesitancy         Addressing concerns, religious exemptions, informed consent
lgbtq-family              Same-sex parenting, non-traditional family structures, donor conception
```

**Design note:** These tags surface articles that specifically address the intersection of medicine and personal beliefs. They don't filter out medical evidence — they ADD relevant context.

---

## Tag Count Summary

| Dimension | Tags | Change vs V1 | Purpose |
|-----------|------|--------------|---------|
| Life Stage | 22 | +4 | Who is this about? |
| Topic | 42 | +12 | What subject area? |
| Condition/Concern | 45 | +25 | What medical issue? |
| Clinical Intent | 8 | +2 | What kind of answer? |
| Approach/Preference | 28 | +13 | What philosophy? |
| Care Level | 5 | — | How urgent? |
| Evidence Level | 7 | — | How reliable? |
| Audience | 3 | — | What language level? |
| Cultural/Religious | 8 | +2 | What context matters? |
| **Total** | **~168** | **+58** | |

---

## RAG Logic Layer

### 1. Query-to-Tag Extraction

When a parent asks a question, the chatbot preprocesses it through a lightweight LLM call (Claude Haiku or similar) that extracts relevant tags across all 9 dimensions. The extraction prompt:

```
Given this parent question: "{question}"

Extract the most relevant tags from each dimension. Return JSON:
{
  "life_stage": ["infant"],
  "topic": ["sleep-training"],
  "condition": [],
  "intent": ["decision-support"],
  "approach": ["attachment-parenting"],
  "care_level": ["self-care"],
  "evidence_pref": [],
  "audience_pref": ["parent-friendly"],
  "cultural": []
}

Rules:
- Use ONLY tags from the official taxonomy (provided below).
- Extract 1-3 tags per dimension. Leave empty if not relevant.
- For intent, consider what kind of answer the parent wants.
- For care_level, if the question describes symptoms, assess urgency.
- If the question mentions a specific approach or philosophy, tag it.
```

### 2. Search Strategy

**Step 1 — Safety check.**
If `care_level` = `emergency` or `urgent-care`, immediately prepend a safety disclaimer and prioritize `clinical-guidelines` + `safety-guidance` tagged articles. Do NOT wait for full RAG retrieval.

**Step 2 — Tag-filtered vector search.**
```sql
SELECT a.id, a.title, a.abstract, a.url, a.full_text_url,
       1 - (a.embedding <=> query_embedding) AS similarity,
       array_agg(t.slug) AS tags
FROM articles.articles a
JOIN articles.article_tags at ON a.id = at.article_id
JOIN articles.tags t ON at.tag_id = t.id
WHERE t.slug = ANY($life_stage_tags)
  AND t.slug = ANY($topic_tags)
  AND a.status IN ('auto_tagged', 'verified')
GROUP BY a.id
ORDER BY similarity DESC
LIMIT 20;
```

**Step 3 — Cascade fallback (if fewer than 5 results).**

```
Level 0: life_stage + topic + condition + intent          → exact match
Level 1: life_stage + topic + condition                   → drop intent
Level 2: life_stage + topic                               → drop condition
Level 3: topic only                                       → broadest
Level 4: vector similarity only (no tag filter)           → fallback
```

At each level, if ≥5 results found, stop cascading. Approach/preference tags are never hard filters — they boost ranking by +0.1 similarity when matched.

**Step 4 — Re-rank by evidence quality.**
Within the result set, re-rank so that `clinical-guidelines` and `systematic-review` articles appear first, followed by `rct`, then `cohort-study`, etc. This ensures the chatbot's top context comes from the strongest evidence.

**Step 5 — Audience translation.**
If the top results are tagged `clinical` or `research` (not `parent-friendly`), the chatbot's response prompt includes an instruction to translate medical terminology into plain language.

### 3. Summarization & Citation Logic

This is the core of making clinical papers useful to parents. The chatbot does NOT simply dump abstracts — it synthesizes them into a clear, conversational answer with citations.

**Summarization prompt template:**

```
You are a knowledgeable, warm health information assistant for parents.
You are NOT a doctor. You do NOT provide medical advice or diagnoses.
You summarize what published research and clinical guidelines say.

CONTEXT ARTICLES:
{articles_with_metadata}

PARENT QUESTION:
{question}

RULES:
1. Answer in plain, conversational language a non-medical parent can understand.
2. If the question involves symptoms or medical concerns, always say
   "Talk to your pediatrician/OB" or "Call your provider."
3. Translate medical jargon. Example: "Otitis media" → "ear infection."
4. Cite sources inline using [Author Year] or [Guideline Name].
5. At the end, list sources with links so the parent can read more.
6. If articles conflict, present both perspectives fairly.
7. Mention the evidence level: "A large review of studies found..."
   vs "One small study suggested..." so parents can weigh it.
8. Keep responses under 300 words unless the topic is complex.
9. NEVER say "studies show" without specifying which kind of study.
10. If the parent's stated approach/preference is relevant, acknowledge it
    without judgment: "Since you're interested in [approach], here's what
    the research says specifically about that..."
```

**Citation format in chatbot responses:**

```
According to the AAP's 2024 guidelines on infant sleep safety,
room-sharing without bed-sharing is recommended for at least the
first 6 months [AAP 2024]. A Cochrane review of sleep training
methods found that graduated extinction was effective and showed
no adverse effects on infant attachment at 5-year follow-up
[Hiscock et al. 2023].

📚 Sources:
- AAP Clinical Report: Safe Sleep (2024) — pubmed.ncbi.nlm.nih.gov/...
- Hiscock H, et al. "Long-term effects..." Cochrane Review — doi.org/...
```

### 4. Safety & Disclaimer Logic

**Hard rules the chatbot must always follow:**

| Trigger | Action |
|---------|--------|
| Any question about infant <3 months with fever | Prepend: "Fever in a baby under 3 months is always an emergency. Call your pediatrician or go to the ER immediately." |
| Question implies self-harm, suicidal ideation | Route to crisis resources (988 Lifeline). Do not attempt to counsel. |
| Question asks for a diagnosis | "I can share what research says about those symptoms, but only your doctor can diagnose. Please reach out to your provider." |
| Question asks for medication dosing | "Medication dosing should always come from your pediatrician or pharmacist. Here's general information about [topic]..." |
| Question about a recalled product | Surface the recall information with a clear warning. |
| Emergency symptoms described | Prepend red-flag warning. Tag with `emergency` or `urgent-care`. |

---

## How This Works in Practice — Worked Examples

### Example 1: First-time parent, natural birth preference

```
User profile: first-trimester, preference: natural-birth, midwifery-model

User: "I'm 14 weeks and having round ligament pain. Is this normal?"

Tag extraction:
  life_stage: [second-trimester]
  topic: [prenatal-care]
  condition: []
  intent: [what-to-expect]
  approach: [natural-unmedicated, midwifery-model]
  care_level: [self-care]

Search: second-trimester + prenatal-care + what-to-expect
Approach boost: natural-unmedicated, midwifery-model
Audience filter: parent-friendly preferred

Chatbot: Explains round ligament pain with evidence, suggests
stretches and comfort measures (aligned with low-intervention
preference), notes when to call provider.
```

### Example 2: Parent with sick infant

```
User: "My 3 month old has a 101 fever, should I go to the ER?"

Tag extraction:
  life_stage: [infant]
  topic: []
  condition: [fever-illness]
  intent: [safety-guidance]
  care_level: [urgent-care]  ← triggers safety-first path

SAFETY CHECK FIRES → prepend disclaimer immediately

Search: infant + fever-illness + safety-guidance + clinical-guidelines
Evidence boost: clinical-guidelines first

Chatbot: "For a baby just at 3 months, a fever of 101°F should
be evaluated by your pediatrician right away or at the ER.
The AAP recommends that any fever in an infant under 3 months
be treated as a potential emergency. Please call your
pediatrician now or go to the ER."
```

### Example 3: Formula-feeding parent, no judgment

```
User: "Best formula for a gassy baby?"

Tag extraction:
  life_stage: [infant]
  topic: [formula-feeding]
  condition: [reflux-colic]
  intent: [treatment, decision-support]
  approach: [exclusive-formula]

Search: infant + formula-feeding + reflux-colic
Approach match: exclusive-formula (no breastfeeding content surfaces)
Audience: parent-friendly

Chatbot: Provides evidence-based formula guidance (hydrolyzed
formulas, feeding positions, pacing) without any breastfeeding
promotion. Respects the parent's choice completely.
```

### Example 4: Child development concern

```
User: "My 2 year old isn't talking yet. Should I be worried?"

Tag extraction:
  life_stage: [toddler]
  topic: [speech-language, developmental-screening]
  condition: [speech-delay]
  intent: [screening, what-to-expect]
  care_level: [routine-medical]

Search: toddler + speech-language + speech-delay + screening
Evidence boost: clinical-guidelines (AAP milestone guidance)

Chatbot: Summarizes AAP speech milestones for 24 months (should
have ~50 words, some 2-word phrases). Notes variation is normal
but recommends requesting a developmental screening (ASQ-3) and
speech evaluation from pediatrician. Mentions early intervention
services are free in most states. Cites AAP milestone guidance
and ASHA speech development norms.
```

### Example 5: Postpartum mental health

```
User: "I feel so anxious all the time since having my baby.
I keep checking if she's breathing. Is this normal?"

Tag extraction:
  life_stage: [postpartum, fourth-trimester]
  topic: [perinatal-mood-disorders]
  condition: []
  intent: [screening, what-to-expect]
  care_level: [routine-medical]

Search: postpartum + perinatal-mood-disorders + screening
Evidence boost: clinical-guidelines

Chatbot: Validates the feeling ("many new parents experience
heightened anxiety after birth"). Distinguishes normal new-parent
worry from Postpartum Anxiety (PPA), which affects ~16-17% of
new mothers. Describes the Edinburgh Postnatal Depression Scale
(EPDS) and encourages talking to OB/midwife. Lists PSI helpline.
Cites ACOG Committee Opinion on perinatal mental health screening.
```

### Example 6: Parenting approach with integrative medicine

```
User: "Is chiropractic safe for my baby's colic?"

Tag extraction:
  life_stage: [infant]
  topic: []
  condition: [reflux-colic]
  intent: [treatment, decision-support]
  approach: [integrative-complementary]
  care_level: [self-care]

Search: infant + reflux-colic + integrative-complementary + treatment
Cascade: only 2 articles found → broaden to infant + reflux-colic + treatment → 18 articles
Boost the 2 integrative articles in ranking

Chatbot: Presents what limited evidence exists for chiropractic
care in infant colic (small studies, mixed results). Also presents
conventional approaches (feeding changes, probiotics, comfort
techniques). Notes the evidence level honestly: "A few small
studies suggest..." vs "Large reviews have found..." Encourages
discussing with pediatrician. No judgment on the parent's interest.
```

### Example 7: Dad struggling with adjustment

```
User: "I feel like I'm failing as a dad. My wife does everything
and I just feel useless."

Tag extraction:
  life_stage: [paternal-health]
  topic: [paternal-mental-health, relationship-wellness]
  condition: []
  intent: [what-to-expect]
  care_level: [self-care]

Search: paternal-health + paternal-mental-health
Evidence boost: clinical-guidelines, parent-friendly

Chatbot: Validates the experience. Notes that paternal postpartum
depression affects ~8-10% of new fathers and often presents as
feelings of inadequacy, irritability, or withdrawal. Suggests
specific ways dads can bond (skin-to-skin, bath time, reading).
Mentions Postpartum Support International has resources for dads.
Gently suggests screening if feelings persist.
```

---

## Hierarchy & Cascade Rules

### Parent-Child Relationships

```
pregnancy → first-trimester, second-trimester, third-trimester, high-risk-pregnancy
postpartum → postpartum-recovery, fourth-trimester
breastfeeding ↔ exclusive-breastfeeding (cross-dimension link)
natural-unmedicated ↔ water-birth, home-birth, birth-center, midwifery-model (frequently co-occur)
child-mental-health ↔ adolescent-mental-health (share many conditions)
```

### Search Cascade Logic

1. Try exact tag match combination first
2. If fewer than 5 results: broaden life stage to parent tag (e.g., `toddler` → `infant` + `toddler`)
3. If still too few: drop approach/preference filter, keep topic + intent
4. If still too few: drop intent, keep topic + life stage
5. If still too few: drop condition, keep topic only
6. Final fallback: pure vector similarity with no tag filter
7. Always keep evidence level for **ranking**, never drop it

---

## Tagging Pipeline Updates

### L1 — Keyword Matching (fast, regex-based)

Add keyword patterns for all new tags. Examples:

| Tag | Keywords / Patterns |
|-----|-------------------|
| `perinatal-mood-disorders` | postpartum depression, PPD, PPA, postpartum anxiety, postpartum OCD, baby blues, Edinburgh, EPDS |
| `autism-spectrum` | autism, ASD, M-CHAT, ADOS, spectrum disorder, autistic |
| `adhd` | ADHD, attention deficit, hyperactivity, inattentive, Vanderbilt |
| `speech-delay` | language delay, late talker, speech therapy, apraxia, stuttering |
| `home-birth` | home birth, out-of-hospital, planned home delivery |
| `water-birth` | water birth, waterbirth, tub birth, aquatic birth |
| `baby-led-weaning` | baby-led weaning, BLW, self-feeding, finger foods |
| `cholestasis` | cholestasis, bile acids, intrahepatic, ICP, pruritus pregnancy |
| `plagiocephaly` | flat head, plagiocephaly, torticollis, helmet therapy |
| `gentle-parenting` | gentle parenting, positive discipline, emotion coaching, no punishment |
| `pelvic-floor-dysfunction` | pelvic floor, diastasis recti, incontinence, prolapse |
| `safety-guidance` | call 911, emergency room, ER, red flag, call doctor, seek care |

### L2 — MeSH Mapping

Map MeSH descriptors to new tags:

| MeSH Term | → Tag |
|-----------|-------|
| Depression, Postpartum | `perinatal-mood-disorders` |
| Autism Spectrum Disorder | `autism-spectrum` |
| Attention Deficit Disorder with Hyperactivity | `adhd` |
| Language Development Disorders | `speech-delay` |
| Home Childbirth | `home-birth` |
| Breast Feeding | `breastfeeding`, `exclusive-breastfeeding` |
| Cesarean Section | `cesarean-birth` |
| Cholestasis, Intrahepatic | `cholestasis` |
| Plagiocephaly | `plagiocephaly` |
| Hip Dislocation, Congenital | `hip-dysplasia` |
| Frenulum, Lingual | `tongue-lip-tie` |
| Sensory Receptor Disorders | `sensory-processing` |
| Cerebral Palsy | `cerebral-palsy` |
| Down Syndrome | `down-syndrome` |
| Asthma | `allergies-asthma` |
| Eczema | `rashes-skin-conditions`, `skin-care` |
| Otitis Media | `ear-infections` |
| Respiratory Syncytial Virus | `infectious-disease` |

### L3 — LLM Classification (Claude)

Updated prompt for the LLM tagger:

```
You are classifying a medical article for a parent-facing health app.
Given the title and abstract below, assign tags from EACH relevant dimension.

ARTICLE:
Title: {title}
Abstract: {abstract}

TAXONOMY:
{full_taxonomy_json}

Return a JSON object with tags and confidence scores (0.0-1.0):
{
  "life_stage": [{"tag": "infant", "confidence": 0.95}],
  "topic": [{"tag": "sleep-safety", "confidence": 0.9}],
  "condition": [],
  "intent": [{"tag": "clinical-guidelines", "confidence": 0.85}],
  "approach": [],
  "care_level": [{"tag": "self-care", "confidence": 0.7}],
  "evidence_level": [{"tag": "systematic-review", "confidence": 0.95}],
  "audience": [{"tag": "clinical", "confidence": 0.8}],
  "cultural": []
}

Rules:
- Assign 1-3 tags per dimension. Skip dimensions that don't apply.
- Confidence thresholds: ≥0.7 to assign. Omit anything below.
- For evidence_level, classify based on study design described.
- For audience, assess language complexity and target reader.
- For care_level, assess whether the article discusses emergencies,
  urgent situations, routine care, or general wellness.
- For intent, consider what question this article answers.
```

---

## Migration Strategy

### Phase 1: Schema Changes (non-breaking)

```sql
-- Add dimension column to tags table
ALTER TABLE articles.tags ADD COLUMN dimension TEXT;

-- Add parent_id for tag hierarchy
ALTER TABLE articles.tags ADD COLUMN parent_id UUID REFERENCES articles.tags(id);

-- Add display_name for parent-facing labels
ALTER TABLE articles.tags ADD COLUMN display_name TEXT;

-- Index for dimension queries
CREATE INDEX idx_tags_dimension ON articles.tags(dimension);
```

### Phase 2: Insert New Tags

Insert all ~168 tags with proper `dimension`, `parent_id`, `display_name`, and `slug`. Keep existing 39 tags active — remap them to the new taxonomy where possible.

```sql
-- Example inserts
INSERT INTO articles.tags (slug, name, dimension, display_name, parent_id)
VALUES
  ('pre-conception', 'Pre-Conception', 'life_stage', 'Trying to Conceive', NULL),
  ('pregnancy', 'Pregnancy', 'life_stage', 'Pregnancy', NULL),
  ('first-trimester', 'First Trimester', 'life_stage', 'First Trimester (Weeks 1-13)', {pregnancy_id}),
  -- ... all tags ...
;
```

### Phase 3: Reclassify Existing Articles

Run LLM (Claude) batch classification on all ~30k articles for the new dimensions. Use the local embedder tool's `--retag` flag:

```bash
python embedder.py --retag --limit 500 --batch-size 50
```

Processing order:
1. Clinical intent, care level, audience → classifiable from title+abstract alone (fast, high accuracy)
2. Approach/preference tags → require reading content more carefully, LLM best here
3. New condition tags → keyword matching catches most, LLM fills gaps

Estimated time: ~30k articles × ~0.5s per LLM call = ~4 hours. Batch in chunks of 500 with rate limiting.

### Phase 4: Update L1 + L2 Taggers

- Add keyword regex patterns for all new tags (L1)
- Map additional MeSH descriptors to new tags (L2)
- Update L3 LLM prompt with full new taxonomy
- Test on 100 sample articles, verify accuracy ≥85% per dimension

### Phase 5: Remap Existing Broad Tags

Reclassify articles under broad tags (`nutrition`, `sleep`, `safety`) into specific subtags. Keep broad tags as parent aliases for backward compatibility.

### Phase 6: Wire Into Chatbot RAG

1. Add query-to-tag extraction in the chatbot preprocessing layer
2. Implement cascade fallback logic (described above)
3. Add user preference profile to bias tag selection
4. Implement summarization prompt with citation formatting
5. Add safety check layer (emergency/urgent triage)
6. Test retrieval precision on 50 sample parent questions
7. A/B test: tag-filtered search vs pure vector similarity → measure answer relevance

---

## Appendix A: Key Reference Organizations

These organizations' guidelines should always be tagged `clinical-guidelines` and given highest retrieval priority:

| Organization | Abbreviation | Coverage |
|-------------|-------------|----------|
| American Academy of Pediatrics | AAP | Child health, developmental screening, vaccines, safe sleep |
| American College of OB/GYNs | ACOG | Pregnancy, labor, postpartum, maternal health |
| World Health Organization | WHO | Global maternal/child health, breastfeeding, nutrition |
| Centers for Disease Control | CDC | Vaccines, disease prevention, growth standards |
| Society for Maternal-Fetal Medicine | SMFM | High-risk pregnancy |
| American Academy of Family Physicians | AAFP | Primary care, well-child visits |
| Postpartum Support International | PSI | Perinatal mental health |
| American Speech-Language-Hearing Assoc | ASHA | Speech/language development |
| March of Dimes | MoD | Prematurity, birth defects, maternal health |

## Appendix B: Developmental Screening Schedule

For the chatbot to proactively suggest screenings at appropriate ages:

| Age | Screen | Tool |
|-----|--------|------|
| Newborn | Hearing, metabolic, congenital heart | State newborn screen |
| 2 months | Development | ASQ-3 |
| 4 months | Development | ASQ-3 |
| 6 months | Development | ASQ-3 |
| 9 months | Development | ASQ-3 (AAP recommended) |
| 12 months | Development, lead risk | ASQ-3 |
| 18 months | Development, autism | ASQ-3 + M-CHAT-R (AAP recommended) |
| 24 months | Development, autism | ASQ-3 + M-CHAT-R (AAP recommended) |
| 30 months | Development | ASQ-3 (AAP recommended) |
| 3-5 years | Vision, hearing, development | Eye exam, audiometry, ASQ-3 |
| School entry | Vision, hearing, dental | School screening |
| Annually | Growth, development, behavioral | Well-child visit |

## Appendix C: Sleep Method Quick-Reference

For chatbot responses about sleep training (high-frequency question category):

| Method | Description | Parental Involvement | Evidence |
|--------|-------------|---------------------|----------|
| Extinction (CIO) | Put down awake, no response until morning | None during night | Strong (effective, no long-term harm) |
| Ferber (graduated) | Timed check-ins at increasing intervals | Brief check-ins | Strong |
| Chair method | Parent sits nearby, gradually moves away | Present but minimal | Moderate |
| Pick-up/put-down | Pick up when crying, put down when calm | High | Limited |
| Co-sleeping | Shared sleep surface | Continuous | Cultural; AAP advises against bed-sharing |
| Room-sharing | Separate surface, same room | Proximity | AAP recommended first 6-12 months |
| Montessori floor bed | Low bed, child-proofed room | Room available | Limited |
