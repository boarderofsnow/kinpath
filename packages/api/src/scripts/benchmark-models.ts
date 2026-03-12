/**
 * Kinpath Chat — Model Benchmark Script
 *
 * Compares Claude Haiku vs Claude Sonnet for response time and quality
 * across a representative set of parenting questions.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=<key> npx ts-node src/scripts/benchmark-models.ts
 *
 * Optional flags:
 *   --runs <n>       Number of runs per question per model (default: 1)
 *   --delay <ms>     Delay between API calls in ms (default: 500)
 */

import Anthropic from "@anthropic-ai/sdk";

// ── Config ────────────────────────────────────────────────────────────────────

const MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
} as const;

const MAX_TOKENS = 1024;

// Parse CLI flags
const args = process.argv.slice(2);
const RUNS_PER_QUESTION = parseInt(args[args.indexOf("--runs") + 1] ?? "1", 10) || 1;
const DELAY_MS = parseInt(args[args.indexOf("--delay") + 1] ?? "500", 10) || 500;

// ── System prompt (mirrors ai.ts) ─────────────────────────────────────────────

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
- Use markdown formatting: **bold** for emphasis, bullet lists for multiple points, numbered lists for steps
- IMPORTANT: When child context is provided, always tailor your answer to the child's specific age and developmental stage. Reference the child by name when appropriate.`;

// ── Test cases ────────────────────────────────────────────────────────────────

interface TestCase {
  id: string;
  label: string;
  message: string;
  childContext?: string;
  /** Keywords that a good response should include */
  expectedKeywords: string[];
  /** True if the question is medical — response should recommend a doctor */
  isMedical?: boolean;
}

const TEST_CASES: TestCase[] = [
  {
    id: "sleep-regression",
    label: "4-month sleep regression",
    message: "My baby suddenly started waking up every hour at night. Is this the 4-month sleep regression and what can I do?",
    childContext: "\n\nCHILD CONTEXT:\nChild's name: Lily\nAge: 4 months old (born 2025-11-11)\nDevelopmental stage: infant (3-6 months)",
    expectedKeywords: ["sleep", "regression", "Lily"],
  },
  {
    id: "toddler-tantrum",
    label: "Toddler tantrums",
    message: "My 2-year-old throws massive tantrums every time we leave the playground. How do I handle this?",
    childContext: "\n\nCHILD CONTEXT:\nChild's name: Noah\nAge: 2 years old\nDevelopmental stage: toddler (18-24 months)",
    expectedKeywords: ["tantrum", "Noah"],
  },
  {
    id: "breastfeeding-latch",
    label: "Breastfeeding latch issues",
    message: "My newborn keeps unlatching and seems frustrated during feeds. What could be causing this?",
    childContext: "\n\nCHILD CONTEXT:\nChild's name: Emma\nAge: 12 days old\nDevelopmental stage: newborn",
    expectedKeywords: ["latch", "Emma"],
  },
  {
    id: "fever-medical",
    label: "Infant fever (medical)",
    message: "My 2-month-old has a temperature of 38.5°C. Should I be worried?",
    childContext: "\n\nCHILD CONTEXT:\nChild's name: James\nAge: 8 weeks old\nDevelopmental stage: newborn",
    expectedKeywords: ["doctor", "pediatrician"],
    isMedical: true,
  },
  {
    id: "prenatal-nutrition",
    label: "Prenatal nutrition",
    message: "I'm in my second trimester and craving sushi. Is it safe to eat raw fish while pregnant?",
    childContext: "\n\nCHILD CONTEXT:\nChild's name: Baby\nStatus: Prenatal — approximately 20 weeks pregnant (due 2026-08-01)\nTrimester: second",
    expectedKeywords: ["raw", "fish", "pregnancy"],
  },
  {
    id: "starting-solids",
    label: "Starting solid foods",
    message: "When should I start introducing solid foods and what should I start with?",
    childContext: "\n\nCHILD CONTEXT:\nChild's name: Mia\nAge: 5 months and 2 weeks old\nDevelopmental stage: infant (3-6 months)",
    expectedKeywords: ["solid", "Mia"],
  },
  {
    id: "no-child-context",
    label: "General question (no child context)",
    message: "What are the most important things to look for in a pediatrician?",
    expectedKeywords: ["pediatrician"],
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface RunResult {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  responseText: string;
}

interface ModelResult {
  modelKey: keyof typeof MODELS;
  modelId: string;
  runs: RunResult[];
  avgLatencyMs: number;
  avgOutputTokens: number;
  avgInputTokens: number;
}

interface QualityScore {
  usesMarkdown: boolean;
  hasExpectedKeywords: boolean;
  medicalSafetyRespected: boolean | null;
  responseLength: number;
  paragraphCount: number;
  hasCitationAttempt: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSystem(childContext?: string): string {
  return `${SYSTEM_PROMPT}${childContext ?? ""}\n\nRELEVANT RESOURCES:\nNo specific resources found for this query.`;
}

function scoreQuality(text: string, testCase: TestCase): QualityScore {
  const lower = text.toLowerCase();

  const usesMarkdown =
    text.includes("**") || text.includes("- ") || text.includes("1.") || text.includes("##");

  const hasExpectedKeywords = testCase.expectedKeywords.every((kw) =>
    lower.includes(kw.toLowerCase())
  );

  const medicalSafetyRespected =
    testCase.isMedical != null
      ? testCase.isMedical
        ? lower.includes("doctor") || lower.includes("pediatrician") || lower.includes("emergency")
        : true
      : null;

  const paragraphCount = text
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0).length;

  const hasCitationAttempt = /\[\d+\]/.test(text);

  return {
    usesMarkdown,
    hasExpectedKeywords,
    medicalSafetyRespected,
    responseLength: text.length,
    paragraphCount,
    hasCitationAttempt,
  };
}

function fmt(n: number, decimals = 0): string {
  return n.toFixed(decimals).padStart(8);
}

function bool(v: boolean | null): string {
  if (v === null) return "  n/a ";
  return v ? "  yes " : "  NO  ";
}

// ── Core benchmark ────────────────────────────────────────────────────────────

async function runModel(
  client: Anthropic,
  modelKey: keyof typeof MODELS,
  testCase: TestCase,
  runs: number
): Promise<ModelResult> {
  const modelId = MODELS[modelKey];
  const results: RunResult[] = [];

  for (let i = 0; i < runs; i++) {
    if (i > 0) await sleep(DELAY_MS);

    const start = Date.now();
    const response = await client.messages.create({
      model: modelId,
      max_tokens: MAX_TOKENS,
      system: buildSystem(testCase.childContext),
      messages: [{ role: "user", content: testCase.message }],
    });
    const latencyMs = Date.now() - start;

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    results.push({
      latencyMs,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      responseText,
    });
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    modelKey,
    modelId,
    runs: results,
    avgLatencyMs: avg(results.map((r) => r.latencyMs)),
    avgOutputTokens: avg(results.map((r) => r.outputTokens)),
    avgInputTokens: avg(results.map((r) => r.inputTokens)),
  };
}

// ── Report ────────────────────────────────────────────────────────────────────

interface BenchmarkResult {
  testCase: TestCase;
  haiku: ModelResult;
  sonnet: ModelResult;
}

function printReport(results: BenchmarkResult[]) {
  const LINE = "─".repeat(100);
  const DLINE = "═".repeat(100);

  console.log("\n" + DLINE);
  console.log(" Kinpath Chat — Model Benchmark Report");
  console.log(` Haiku: ${MODELS.haiku}`);
  console.log(` Sonnet: ${MODELS.sonnet}`);
  console.log(` Runs per question: ${RUNS_PER_QUESTION}`);
  console.log(DLINE);

  for (const result of results) {
    const { testCase, haiku, sonnet } = result;
    const hQuality = scoreQuality(haiku.runs[haiku.runs.length - 1].responseText, testCase);
    const sQuality = scoreQuality(sonnet.runs[sonnet.runs.length - 1].responseText, testCase);

    console.log(`\n▸ ${testCase.label}`);
    console.log(`  Q: "${testCase.message.slice(0, 80)}${testCase.message.length > 80 ? "…" : ""}"`);
    console.log(LINE);

    console.log(
      `  ${"Metric".padEnd(26)} ${"Haiku".padEnd(12)} ${"Sonnet".padEnd(12)} ${"Winner".padEnd(10)}`
    );
    console.log("  " + "─".repeat(60));

    const latencyWinner = haiku.avgLatencyMs < sonnet.avgLatencyMs ? "haiku ✓" : "sonnet ✓";
    console.log(
      `  ${"Avg latency (ms)".padEnd(26)} ${fmt(haiku.avgLatencyMs)} ${fmt(sonnet.avgLatencyMs)} ${latencyWinner}`
    );

    const tokenWinner = haiku.avgOutputTokens > sonnet.avgOutputTokens ? "haiku ✓" : sonnet.avgOutputTokens > haiku.avgOutputTokens ? "sonnet ✓" : "tie";
    console.log(
      `  ${"Avg output tokens".padEnd(26)} ${fmt(haiku.avgOutputTokens)} ${fmt(sonnet.avgOutputTokens)} ${tokenWinner}`
    );

    console.log(
      `  ${"Response chars".padEnd(26)} ${fmt(hQuality.responseLength)} ${fmt(sQuality.responseLength)}`
    );
    console.log(
      `  ${"Paragraphs".padEnd(26)} ${fmt(hQuality.paragraphCount)} ${fmt(sQuality.paragraphCount)}`
    );

    console.log("  " + "─".repeat(60));
    console.log(
      `  ${"Uses markdown".padEnd(26)} ${bool(hQuality.usesMarkdown)} ${bool(sQuality.usesMarkdown)}`
    );
    console.log(
      `  ${"Expected keywords".padEnd(26)} ${bool(hQuality.hasExpectedKeywords)} ${bool(sQuality.hasExpectedKeywords)}`
    );
    if (testCase.isMedical) {
      console.log(
        `  ${"Medical safety (→ doctor)".padEnd(26)} ${bool(hQuality.medicalSafetyRespected)} ${bool(sQuality.medicalSafetyRespected)}`
      );
    }
    console.log(
      `  ${"Cites resources".padEnd(26)} ${bool(hQuality.hasCitationAttempt)} ${bool(sQuality.hasCitationAttempt)}`
    );
  }

  // ── Summary table ──────────────────────────────────────────────────────────
  console.log("\n" + DLINE);
  console.log(" Summary");
  console.log(DLINE);

  const haikuLatencies = results.map((r) => r.haiku.avgLatencyMs);
  const sonnetLatencies = results.map((r) => r.sonnet.avgLatencyMs);
  const haikuTokens = results.map((r) => r.haiku.avgOutputTokens);
  const sonnetTokens = results.map((r) => r.sonnet.avgOutputTokens);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  console.log(
    `  ${"Overall avg latency (ms)".padEnd(30)} Haiku: ${fmt(avg(haikuLatencies))}   Sonnet: ${fmt(avg(sonnetLatencies))}`
  );
  console.log(
    `  ${"Overall avg output tokens".padEnd(30)} Haiku: ${fmt(avg(haikuTokens))}   Sonnet: ${fmt(avg(sonnetTokens))}`
  );

  const haikuKeywordWins = results.filter((r) =>
    scoreQuality(r.haiku.runs[r.haiku.runs.length - 1].responseText, r.testCase).hasExpectedKeywords
  ).length;
  const sonnetKeywordWins = results.filter((r) =>
    scoreQuality(r.sonnet.runs[r.sonnet.runs.length - 1].responseText, r.testCase).hasExpectedKeywords
  ).length;

  console.log(
    `  ${"Keyword pass rate".padEnd(30)} Haiku: ${haikuKeywordWins}/${results.length}        Sonnet: ${sonnetKeywordWins}/${results.length}`
  );

  const speedup = avg(sonnetLatencies) / avg(haikuLatencies);
  console.log(`\n  Haiku is ${speedup.toFixed(1)}x faster than Sonnet on average`);
  console.log(DLINE + "\n");
}

// ── Verbose response dump (optional) ─────────────────────────────────────────

function printResponses(results: BenchmarkResult[]) {
  const DLINE = "═".repeat(100);
  console.log("\n" + DLINE);
  console.log(" Full Responses (last run of each model)");
  console.log(DLINE);

  for (const { testCase, haiku, sonnet } of results) {
    const hText = haiku.runs[haiku.runs.length - 1].responseText;
    const sText = sonnet.runs[sonnet.runs.length - 1].responseText;

    console.log(`\n▸ ${testCase.label}`);
    console.log("─── HAIKU ───────────────────────────────────────────────────────────────────────────────────────────");
    console.log(hText);
    console.log("─── SONNET ──────────────────────────────────────────────────────────────────────────────────────────");
    console.log(sText);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });
  const results: BenchmarkResult[] = [];

  console.log(`\nRunning Kinpath Chat benchmark — ${TEST_CASES.length} questions × ${RUNS_PER_QUESTION} run(s) × 2 models`);
  console.log(`Delay between calls: ${DELAY_MS}ms\n`);

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    process.stdout.write(`[${i + 1}/${TEST_CASES.length}] ${testCase.label} ... `);

    const [haikuResult, sonnetResult] = await Promise.all([
      runModel(client, "haiku", testCase, RUNS_PER_QUESTION),
      (async () => {
        // Stagger sonnet calls slightly to avoid rate-limit spikes
        await sleep(200);
        return runModel(client, "sonnet", testCase, RUNS_PER_QUESTION);
      })(),
    ]);

    results.push({ testCase, haiku: haikuResult, sonnet: sonnetResult });

    const winner =
      haikuResult.avgLatencyMs < sonnetResult.avgLatencyMs
        ? `haiku faster (${Math.round(haikuResult.avgLatencyMs)}ms vs ${Math.round(sonnetResult.avgLatencyMs)}ms)`
        : `sonnet faster (${Math.round(sonnetResult.avgLatencyMs)}ms vs ${Math.round(haikuResult.avgLatencyMs)}ms)`;
    console.log(`done — ${winner}`);

    if (i < TEST_CASES.length - 1) await sleep(DELAY_MS);
  }

  printReport(results);

  if (args.includes("--verbose")) {
    printResponses(results);
  }
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
