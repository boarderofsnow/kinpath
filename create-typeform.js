#!/usr/bin/env node
// Typeform survey creator for KinPath Consumer Insights Survey
// Token is passed via argv, never stored.

const TOKEN = process.argv[2];
const BASE  = 'https://api.typeform.com';

if (!TOKEN) { console.error('Usage: node create-typeform.js <token>'); process.exit(1); }

async function tf(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data;
}

async function main() {
  console.log('Creating KinPath consumer insights survey…\n');

  // ── 1. Custom theme ──────────────────────────────────────────────────────
  let themeHref = null;
  try {
    const theme = await tf('POST', '/themes', {
      name: 'KinPath',
      font: 'Source Sans Pro',
      colors: {
        question:   '#1C1917',
        answer:     '#10B89F',
        background: '#F0EEEC',
        button:     '#10B89F',
      },
    });
    themeHref = theme.self?.href ?? theme.href ?? null;
    console.log(`✓ Theme created: ${themeHref}`);
  } catch (e) {
    console.warn(`⚠ Theme creation failed (may require a paid plan): ${e.message}`);
    console.warn('  Continuing without custom theme.\n');
  }

  // ── 2. Field definitions ─────────────────────────────────────────────────
  const fields = [
    // ── Section 1: About You ───────────────────────────────────────────────
    {
      ref: 'q1',
      title: 'How far along are you in your pregnancy?',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: false,
        allow_other_choice: false,
        choices: [
          { ref: 'q1_c1', label: 'First trimester (weeks 1–12)' },
          { ref: 'q1_c2', label: 'Second trimester (weeks 13–26)' },
          { ref: 'q1_c3', label: 'Third trimester (weeks 27–40)' },
          { ref: 'q1_c4', label: "I've recently given birth (within the last 6 months)" },
        ],
      },
    },
    {
      ref: 'q1b',
      title: 'How old is your baby?',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: false,
        allow_other_choice: false,
        choices: [
          { ref: 'q1b_c1', label: 'Less than 4 weeks' },
          { ref: 'q1b_c2', label: '1–3 months' },
          { ref: 'q1b_c3', label: '3–6 months' },
        ],
      },
    },
    {
      ref: 'q2',
      title: 'Is this your first pregnancy?',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: false,
        allow_other_choice: false,
        choices: [
          { ref: 'q2_c1', label: 'Yes, this is my first' },
          { ref: 'q2_c2', label: 'No, I have one other child' },
          { ref: 'q2_c3', label: 'No, I have two or more other children' },
        ],
      },
    },
    {
      ref: 'q3',
      title: 'How would you describe your approach to finding parenting information?',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: false,
        allow_other_choice: false,
        choices: [
          { ref: 'q3_c1', label: 'I research everything thoroughly' },
          { ref: 'q3_c2', label: 'I look things up as specific questions come up' },
          { ref: 'q3_c3', label: 'I mostly rely on advice from people I trust' },
          { ref: 'q3_c4', label: "I feel overwhelmed and don't know where to start" },
        ],
      },
    },

    // ── Section 2: Pain Points ─────────────────────────────────────────────
    {
      ref: 'stmt_pain',
      title: "Now for the important stuff — tell us what actually frustrates you about finding parenting information today. Be as specific as you'd like. There are no wrong answers.",
      type: 'statement',
      properties: { hide_marks: true, button_text: 'Continue' },
    },
    {
      ref: 'q4',
      title: "What's the single hardest part about finding reliable parenting information right now?",
      type: 'long_text',
      validations: { required: true },
    },
    {
      ref: 'q5',
      title: 'How often do you encounter conflicting advice from different sources?',
      type: 'opinion_scale',
      validations: { required: true },
      properties: {
        start_at_one: true,
        steps: 5,
        labels: { left: 'Rarely', right: 'Constantly' },
      },
    },
    {
      ref: 'q6',
      title: 'When you get conflicting information, how does that make you feel?',
      type: 'long_text',
      validations: { required: false },
    },
    {
      ref: 'q7',
      title: 'Have you ever made a parenting decision you later second-guessed because of something you read online? What happened?',
      type: 'long_text',
      validations: { required: false },
    },

    // ── Section 3: Sources & Trust ─────────────────────────────────────────
    {
      ref: 'stmt_sources',
      title: "Let's talk about where you actually go for information — and how much you trust what you find.",
      type: 'statement',
      properties: { hide_marks: true, button_text: 'Continue' },
    },
    {
      ref: 'q8',
      title: 'Where do you currently go for pregnancy and parenting information? Select all that apply.',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: true,
        allow_other_choice: true,
        choices: [
          { ref: 'q8_c1',  label: 'OB-GYN or midwife' },
          { ref: 'q8_c2',  label: 'Pediatrician' },
          { ref: 'q8_c3',  label: 'Family and friends' },
          { ref: 'q8_c4',  label: 'Instagram or TikTok' },
          { ref: 'q8_c5',  label: 'Parenting apps (What to Expect, The Bump, BabyCenter, etc.)' },
          { ref: 'q8_c6',  label: 'Google search' },
          { ref: 'q8_c7',  label: 'Books' },
          { ref: 'q8_c8',  label: 'Reddit or online forums' },
          { ref: 'q8_c9',  label: 'Facebook groups' },
          { ref: 'q8_c10', label: 'Podcasts' },
        ],
      },
    },
    {
      ref: 'q9',
      title: 'Which of those sources do you trust the most, and why?',
      type: 'long_text',
      validations: { required: false },
    },
    {
      ref: 'q10',
      title: "How important is it that parenting information comes from a recognized expert or institution versus another parent's lived experience?",
      type: 'opinion_scale',
      validations: { required: true },
      properties: {
        start_at_one: true,
        steps: 5,
        labels: { left: 'Trust experts most', right: 'Trust real parents most' },
      },
    },
    {
      ref: 'q11a',
      title: 'Have you ever paid for a parenting app, course, or subscription?',
      type: 'yes_no',
      validations: { required: true },
    },
    {
      ref: 'q11b',
      title: "Which one(s), and what did you think of the experience?",
      type: 'long_text',
      validations: { required: false },
    },

    // ── Section 4: Content & Features ─────────────────────────────────────
    {
      ref: 'stmt_features',
      title: "You're halfway through! This section helps us figure out what content and features would actually make your life easier.",
      type: 'statement',
      properties: { hide_marks: true, button_text: 'Continue' },
    },
    {
      ref: 'q12',
      title: 'Which topics do you find yourself searching for most? Select your top 5.',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: true,
        allow_other_choice: false,
        choices: [
          { ref: 'q12_c1',  label: 'Fetal development week by week' },
          { ref: 'q12_c2',  label: 'Nutrition during pregnancy' },
          { ref: 'q12_c3',  label: 'Labor and delivery preparation' },
          { ref: 'q12_c4',  label: 'Newborn care basics' },
          { ref: 'q12_c5',  label: 'Sleep (baby and yours)' },
          { ref: 'q12_c6',  label: 'Breastfeeding and feeding' },
          { ref: 'q12_c7',  label: 'Postpartum mental health' },
          { ref: 'q12_c8',  label: 'Relationship changes after baby' },
          { ref: 'q12_c9',  label: 'Financial planning for a growing family' },
          { ref: 'q12_c10', label: 'Childproofing and safety' },
          { ref: 'q12_c11', label: 'Developmental milestones' },
          { ref: 'q12_c12', label: 'Vaccines and immunizations' },
          { ref: 'q12_c13', label: 'Returning to work / childcare' },
        ],
      },
    },
    {
      ref: 'q13',
      title: 'When you imagine the "perfect" parenting resource, what does it do that nothing currently does?',
      type: 'long_text',
      validations: { required: true },
    },
    // Q14: 7 individual rating fields (1–5 stars) for each feature
    {
      ref: 'q14a',
      title: 'Rate this feature (1–5 ★): Content that updates automatically as your baby grows',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q14b',
      title: 'Rate this feature (1–5 ★): An AI assistant you can ask parenting questions anytime',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q14c',
      title: 'Rate this feature (1–5 ★): Personalized recommendations based on your values',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q14d',
      title: 'Rate this feature (1–5 ★): Weekly email digests for your current stage',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q14e',
      title: 'Rate this feature (1–5 ★): Shared access with a partner or co-parent',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q14f',
      title: 'Rate this feature (1–5 ★): Checklists and planning tools (hospital bag, milestones, etc.)',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q14g',
      title: 'Rate this feature (1–5 ★): Community / forum with parents at the same stage',
      type: 'rating',
      validations: { required: true },
      properties: { steps: 5, shape: 'star' },
    },
    {
      ref: 'q15',
      title: "How important is it that a parenting resource respects your personal values without judgment — around things like feeding choices, vaccination approach, or spiritual beliefs?",
      type: 'opinion_scale',
      validations: { required: true },
      properties: {
        start_at_one: true,
        steps: 5,
        labels: { left: 'Not important', right: 'Dealbreaker for me' },
      },
    },
    {
      ref: 'q16',
      title: 'Would you want your partner or co-parent to have access to the same resource? What would make it useful for both of you?',
      type: 'long_text',
      validations: { required: false },
    },

    // ── Section 5: Timing & Delivery ───────────────────────────────────────
    {
      ref: 'stmt_timing',
      title: 'A few quick questions about when and how you like to consume information.',
      type: 'statement',
      properties: { hide_marks: true, button_text: 'Continue' },
    },
    {
      ref: 'q17',
      title: 'When do you most often look up parenting information? Select all that apply.',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: true,
        allow_other_choice: false,
        choices: [
          { ref: 'q17_c1', label: 'When a specific worry or question comes up' },
          { ref: 'q17_c2', label: 'Browsing casually when I have free time' },
          { ref: 'q17_c3', label: "After a doctor's appointment, to follow up on what was discussed" },
          { ref: 'q17_c4', label: "Late at night when I can't sleep" },
          { ref: 'q17_c5', label: 'On a regular routine (e.g., weekly)' },
        ],
      },
    },
    {
      ref: 'q18',
      title: 'How would you prefer to receive parenting guidance? Rank in order — 1st = most preferred.',
      type: 'ranking',
      validations: { required: true },
      properties: {
        randomize: false,
        choices: [
          { ref: 'q18_c1', label: 'App on my phone' },
          { ref: 'q18_c2', label: 'Website on my computer' },
          { ref: 'q18_c3', label: 'Email digest' },
          { ref: 'q18_c4', label: 'Text / SMS notifications' },
          { ref: 'q18_c5', label: 'Push notifications' },
          { ref: 'q18_c6', label: 'Physical book or printout' },
        ],
      },
    },
    {
      ref: 'q19',
      title: 'How much time per week would you realistically spend on a parenting resource?',
      type: 'multiple_choice',
      validations: { required: true },
      properties: {
        randomize: false,
        allow_multiple_selection: false,
        allow_other_choice: false,
        choices: [
          { ref: 'q19_c1', label: 'Less than 15 minutes' },
          { ref: 'q19_c2', label: '15–30 minutes' },
          { ref: 'q19_c3', label: '30–60 minutes' },
          { ref: 'q19_c4', label: 'More than 1 hour' },
        ],
      },
    },

    // ── Section 6: Pricing ─────────────────────────────────────────────────
    {
      ref: 'stmt_pricing',
      title: 'Almost done! A few questions about what this kind of resource would be worth to you.',
      type: 'statement',
      properties: { hide_marks: true, button_text: 'Continue' },
    },
    {
      ref: 'q20',
      title: "If a service gave you personalized, evidence-based parenting guidance that adapted to your child's age — with expert content, an AI assistant, and planning tools — what would you expect to pay per month?",
      type: 'number',
      validations: { required: true, min_value: 0 },
    },
    {
      ref: 'q21',
      title: 'What would make you cancel a parenting subscription?',
      type: 'long_text',
      validations: { required: false },
    },
    {
      ref: 'q22',
      title: 'Would a free tier with limited access encourage you to try a product like this before committing to a paid plan?',
      type: 'opinion_scale',
      validations: { required: true },
      properties: {
        start_at_one: true,
        steps: 5,
        labels: { left: 'Definitely not', right: 'Definitely yes' },
      },
    },

    // ── Section 7: The Big One ─────────────────────────────────────────────
    {
      ref: 'stmt_final',
      title: 'This is the most important question in the whole survey. Take as much space as you need.',
      type: 'statement',
      properties: { hide_marks: true, button_text: 'Continue' },
    },
    {
      ref: 'q23',
      title: 'If you could have one thing that would make you feel more confident and less stressed as a new parent, what would it be?',
      type: 'long_text',
      validations: { required: true },
    },
    {
      ref: 'q24',
      title: 'Would you like to be notified when this launches? Drop your email below — optional.',
      type: 'email',
      validations: { required: false },
    },
  ];

  // ── 3. Logic jumps ───────────────────────────────────────────────────────
  const logic = [
    // Q1: "recently gave birth" → Q1b, otherwise → Q2
    {
      type: 'field', ref: 'q1',
      actions: [
        {
          action: 'jump',
          details: { to: { type: 'field', value: 'q1b' } },
          condition: { op: 'is', vars: [{ type: 'field', value: 'q1' }, { type: 'choice', value: 'q1_c4' }] },
        },
        {
          action: 'jump',
          details: { to: { type: 'field', value: 'q2' } },
          condition: { op: 'always', vars: [] },
        },
      ],
    },
    // Q1b: always → Q2
    {
      type: 'field', ref: 'q1b',
      actions: [
        { action: 'jump', details: { to: { type: 'field', value: 'q2' } }, condition: { op: 'always', vars: [] } },
      ],
    },
    // Q5: score >= 3 → Q6, else → Q7
    {
      type: 'field', ref: 'q5',
      actions: [
        {
          action: 'jump',
          details: { to: { type: 'field', value: 'q6' } },
          condition: { op: 'greater_equal_than', vars: [{ type: 'field', value: 'q5' }, { type: 'constant', value: 3 }] },
        },
        {
          action: 'jump',
          details: { to: { type: 'field', value: 'q7' } },
          condition: { op: 'always', vars: [] },
        },
      ],
    },
    // Q6: always → Q7
    {
      type: 'field', ref: 'q6',
      actions: [
        { action: 'jump', details: { to: { type: 'field', value: 'q7' } }, condition: { op: 'always', vars: [] } },
      ],
    },
    // Q11a: No → Q12, Yes → Q11b
    {
      type: 'field', ref: 'q11a',
      actions: [
        {
          action: 'jump',
          details: { to: { type: 'field', value: 'q12' } },
          condition: { op: 'is', vars: [{ type: 'field', value: 'q11a' }, { type: 'constant', value: false }] },
        },
        {
          action: 'jump',
          details: { to: { type: 'field', value: 'q11b' } },
          condition: { op: 'always', vars: [] },
        },
      ],
    },
    // Q11b: always → Q12
    {
      type: 'field', ref: 'q11b',
      actions: [
        { action: 'jump', details: { to: { type: 'field', value: 'q12' } }, condition: { op: 'always', vars: [] } },
      ],
    },
  ];

  // ── 4. Assemble and create form ──────────────────────────────────────────
  const payload = {
    title: 'Consumer Insights — Expecting & New Mothers',
    settings: {
      language: 'en',
      progress_bar: 'proportion',
      show_progress_bar: true,
      show_typeform_branding: false,
      is_public: true,
      meta: {
        description: 'Help us build the right parenting resource. 8–10 minutes, fully anonymous.',
      },
    },
    hidden: ['source'],
    welcome_screens: [{
      ref: 'welcome',
      title: 'Quick question — would you share your honest take?',
      properties: {
        description: "We're building a personalized parenting resource for expecting and new parents — and we want to make sure we're solving the right problems.\n\nThis takes about 8–10 minutes. All responses are anonymous. There are no right or wrong answers — just your honest experience.",
        show_button: true,
        button_text: "Let's do it",
      },
    }],
    thankyou_screens: [{
      ref: 'thankyou',
      title: 'Thank you — this genuinely helps.',
      properties: {
        description: "Your answers will directly shape what we build. We're working hard to create something that makes the parenting journey less stressful — and responses like yours are the reason we'll get it right.",
        show_button: true,
        button_text: 'Share with another expecting parent',
        button_mode: 'reload',
        share_icons: false,
      },
    }],
    fields,
    logic,
  };

  if (themeHref) payload.theme = { href: themeHref };

  console.log(`Building form with ${fields.length} fields and ${logic.length} logic rules…`);
  const form = await tf('POST', '/forms', payload);

  const formId  = form.id;
  const shareUrl = form._links?.display ?? `https://form.typeform.com/to/${formId}`;
  const editUrl  = `https://www.typeform.com/form/${formId}/edit`;

  console.log('\n✅  Survey created successfully!\n');
  console.log(`  Form ID:   ${formId}`);
  console.log(`  Edit URL:  ${editUrl}`);
  console.log(`  Share URL: ${shareUrl}\n`);
  console.log('Tracked share links by channel:');
  console.log(`  r/pregnant:        ${shareUrl}?source=reddit_pregnant`);
  console.log(`  r/beyondthebump:   ${shareUrl}?source=reddit_bbb`);
  console.log(`  r/BabyBumps:       ${shareUrl}?source=reddit_babybumps`);
  console.log(`  Facebook:          ${shareUrl}?source=fb`);
  console.log(`  Respondent.io:     ${shareUrl}?source=respondent`);
  console.log(`  Direct / personal: ${shareUrl}?source=direct`);
}

main().catch(e => { console.error('\n❌  Error:', e.message); process.exit(1); });
