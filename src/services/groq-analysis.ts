import { z } from "zod";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

const analysisSchema = z.object({
  validationScore: z.number(),
  validationSummary: z.string(),
  marketNeed: z.number(),
  differentiation: z.number(),
  revenuePotential: z.number(),
  scalability: z.number(),
  technicalFeasibility: z.number(),
  competition: z.number(),
  timing: z.number(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
  mvpFeatures: z.array(z.string()),
  revenueModel: z.array(z.string()),
  keyRisks: z.array(z.string()),
  investorPitch: z.string(),
});

export type StartupIdeaAnalysis = z.infer<typeof analysisSchema>;

function createSafeDefaultAnalysis(): StartupIdeaAnalysis {
  return {
    validationScore: 0,
    validationSummary:
      "The idea needs more evidence around demand, differentiation, and execution before it can be considered investment-ready.",
    marketNeed: 0,
    differentiation: 0,
    revenuePotential: 0,
    scalability: 0,
    technicalFeasibility: 0,
    competition: 0,
    timing: 0,
    strengths: [
      "The concept is interesting, but it still needs clearer product-market fit evidence.",
      "The idea can be shaped into a more defensible startup thesis with better positioning.",
      "There is enough signal to continue refining the opportunity and target audience.",
      "The core concept can be expanded into a more structured MVP and business model.",
      "The idea has potential if it is narrowed and validated against real user pain.",
    ],
    weaknesses: [
      "Demand is not yet proven with concrete user behavior or market signals.",
      "Differentiation is not clearly expressed relative to the current alternatives.",
      "The execution path still needs sharper prioritization and scoping.",
      "The monetization model needs more specificity to feel investor-ready.",
      "The startup would benefit from more evidence around retention and repeat use.",
    ],
    opportunities: [
      "The idea can be refined into a more focused niche with stronger early traction.",
      "There may be room to target underserved users with a clearer workflow advantage.",
      "The concept could become more compelling if the pricing and packaging are sharpened.",
      "A more targeted go-to-market could make the startup easier to validate.",
      "The idea may open up expansion paths once the core use case is proven.",
    ],
    threats: [
      "Similar products may already exist, making differentiation important.",
      "If users do not feel the pain strongly, adoption may remain weak.",
      "Execution complexity could slow the team before product-market fit is reached.",
      "Customers may resist switching unless the workflow advantage is obvious.",
      "Longer sales cycles could reduce early momentum if the use case is broad.",
    ],
    mvpFeatures: [
      "Problem-specific onboarding that captures the user's use case and constraints.",
      "Core workflow automation that delivers the main value of the product quickly.",
      "A lightweight dashboard or result view that makes the output easy to understand.",
      "Collaboration support so teams can review, edit, or share the analysis together.",
      "A simple history or saved-items layer to encourage repeat use.",
      "Basic export or sharing functionality so users can take the output downstream.",
    ],
    revenueModel: [
      "Primary subscription plan for individual founders or small teams.",
      "Secondary team plan with collaboration and workflow features.",
      "Enterprise plan with admin controls, security, and support.",
      "Usage-based add-ons for heavier analysis or premium generation.",
      "Implementation or onboarding services for higher-touch customers.",
    ],
    keyRisks: [
      "The market may not feel painful enough to drive repeated usage.",
      "A weak differentiator could make the product easy to replace.",
      "If the workflow is too broad, users may not understand the core value quickly.",
      "Revenue may be slow to convert if the pricing model is not tightly matched to value.",
      "Operational complexity could grow faster than the product can support.",
    ],
    investorPitch:
      "The startup should sharpen its product-market fit, clarify its differentiation, and prove that the execution path is realistic enough to support sustained growth.",
  };
}

function buildPrompt(idea: string): string {
  return `
Analyze the following startup idea and return only valid JSON.

Do not use markdown, headings, bullets, hashtags, or repeated content.
Return a single JSON object with double-quoted property names only.

validationSummary must be 2-3 sentences only and explain the score using market demand, differentiation, and feasibility.

Score each category explicitly:
- Market Need (25)
- Differentiation (20)
- Revenue Potential (15)
- Scalability (15)
- Technical Feasibility (10)
- Competition (10)
- Timing (5)

Rules:
- validationScore must equal the sum of the seven category scores.
- 50-70 = average startup
- 70-85 = strong startup
- 85-95 = exceptional startup
- 95+ = extremely rare
- Avoid giving the same score to different ideas.
- Scores should be meaningfully different based on the submitted idea.
- Use the full score range when justified.
- Make category scores reflect the idea's real strengths and weaknesses, not generic optimism.
- Do not repeat validationSummary content in investorPitch.
- Keep each section unique.

{
  "validationScore": number,
  "validationSummary": string,
  "marketNeed": number,
  "differentiation": number,
  "revenuePotential": number,
  "scalability": number,
  "technicalFeasibility": number,
  "competition": number,
  "timing": number,
  "strengths": string[],
  "weaknesses": string[],
  "opportunities": string[],
  "threats": string[],
  "mvpFeatures": string[],
  "revenueModel": string[],
  "keyRisks": string[],
  "investorPitch": string
}

Startup Idea:
${idea}

Content requirements:
- strengths: 5 startup-specific strengths with concrete reasoning.
- weaknesses: 5 startup-specific weaknesses with concrete reasoning.
- opportunities: 5 startup-specific opportunities with concrete reasoning.
- threats: 5 startup-specific threats with concrete reasoning.
- mvpFeatures: minimum 6 detailed features, each item should include a feature name and a short explanation.
- revenueModel: minimum 5 recommendations, covering primary, secondary, and enterprise revenue streams.
- keyRisks: 5 detailed risks, each with why it matters.
- investorPitch: 120-250 words, one clean paragraph, founder-ready, professional tone, no markdown, no headings, no hashtags, no repeated content.
- Avoid generic startup language.
- Tailor every response to the exact idea submitted.
`;
}

function extractJsonText(text: string): string {
  const trimmed = text.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function parseMaybeJson(text: string): unknown {
  try {
    return JSON.parse(extractJsonText(text));
  } catch {
    return text;
  }
}

function toStringArray(value: unknown, minimum = 0): string[] {
  const items = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    : [];

  while (items.length < minimum) {
    items.push("Further idea-specific analysis should be added by the model.");
  }

  return items;
}

function clampCategory(value: unknown, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, Math.round(value)));
}

function generateValidationSummary(
  analysis: Omit<StartupIdeaAnalysis, "validationScore" | "validationSummary">,
): string {
  const score =
    analysis.marketNeed +
    analysis.differentiation +
    analysis.revenuePotential +
    analysis.scalability +
    analysis.technicalFeasibility +
    analysis.competition +
    analysis.timing;

  const band =
    score >= 95
      ? "extremely rare"
      : score >= 85
        ? "exceptional"
        : score >= 70
          ? "strong"
          : score >= 50
            ? "average"
            : "early-stage";

  return `This idea scores ${score}/100 and sits in the ${band} range because its market demand, differentiation, and feasibility are ${score >= 70 ? "strong enough to justify deeper validation" : "not yet strong enough to support a confident launch"}. The score reflects the balance between user pain, competitive positioning, timing, and the practical effort required to ship and scale the product.`;
}

function normalizeAnalysis(candidate: unknown): StartupIdeaAnalysis {
  if (typeof candidate === "string") {
    const parsed = parseMaybeJson(candidate);
    if (parsed === candidate) {
      return createSafeDefaultAnalysis();
    }
    return normalizeAnalysis(parsed);
  }

  if (!candidate || typeof candidate !== "object") {
    return createSafeDefaultAnalysis();
  }

  const obj = candidate as Record<string, unknown>;

  const normalized = {
    validationSummary:
      typeof obj.validationSummary === "string" && obj.validationSummary.trim().length > 0
        ? obj.validationSummary.trim()
        : "",
    marketNeed: clampCategory(obj.marketNeed, 25),
    differentiation: clampCategory(obj.differentiation, 20),
    revenuePotential: clampCategory(obj.revenuePotential, 15),
    scalability: clampCategory(obj.scalability, 15),
    technicalFeasibility: clampCategory(obj.technicalFeasibility, 10),
    competition: clampCategory(obj.competition, 10),
    timing: clampCategory(obj.timing, 5),
    strengths: toStringArray(obj.strengths, 5),
    weaknesses: toStringArray(obj.weaknesses, 5),
    opportunities: toStringArray(obj.opportunities, 5),
    threats: toStringArray(obj.threats, 5),
    mvpFeatures: toStringArray(obj.mvpFeatures, 6),
    revenueModel: toStringArray(obj.revenueModel, 5),
    keyRisks: toStringArray(obj.keyRisks, 5),
    investorPitch:
      typeof obj.investorPitch === "string" && obj.investorPitch.trim().length > 0
        ? obj.investorPitch.trim()
        : createSafeDefaultAnalysis().investorPitch,
  } satisfies Omit<StartupIdeaAnalysis, "validationScore">;

  const weightedScore =
    normalized.marketNeed +
    normalized.differentiation +
    normalized.revenuePotential +
    normalized.scalability +
    normalized.technicalFeasibility +
    normalized.competition +
    normalized.timing;

  return {
    ...normalized,
    validationSummary: normalized.validationSummary || generateValidationSummary(normalized),
    validationScore: weightedScore,
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("429") ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("fetch")
  );
}

async function requestWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(url, init);

      if (response.ok) {
        return response;
      }

      const errorBody = await response.text().catch(() => "");
      const error = new Error(`Groq API Error ${response.status}: ${errorBody}`);

      if (response.status === 429 || response.status === 503 || response.status >= 500) {
        lastError = error;
      } else {
        throw error;
      }
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw error;
      }
    }

    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

async function analyzeWithGroq(idea: string): Promise<StartupIdeaAnalysis> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing VITE_GROQ_API_KEY");
  }

  console.log("Using Groq");

  const response = await requestWithRetry(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "user",
          content: buildPrompt(idea),
        },
      ],
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
    }),
  });

  const payload = await response.json();
  console.log("Groq Raw Response:", payload);

  const content = payload?.choices?.[0]?.message?.content ?? "";
  const analysis = normalizeAnalysis(parseMaybeJson(content));

  console.log("Groq analysis successful");
  return analysis;
}

export async function analyzeStartupIdea(idea: string): Promise<StartupIdeaAnalysis> {
  try {
    return await analyzeWithGroq(idea);
  } catch (error) {
    console.error("FULL GROQ ERROR:", error);
    return createSafeDefaultAnalysis();
  }
}

export function getSafeDefaultAnalysis(): StartupIdeaAnalysis {
  return createSafeDefaultAnalysis();
}
