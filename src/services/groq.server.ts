// ─── Groq AI service — SERVER ONLY ───────────────────────────────────────────
// The `.server.ts` suffix tells Vite/Nitro to tree-shake this entire module
// from the client bundle. `process.env.GROQ_API_KEY` never reaches the browser.

import process from "node:process";
import Groq from "groq-sdk";
import type { StartupAnalysis, MVPFeature, RevenueStream, KeyRisk, InvestorPitch } from "@/lib/atlas/types";

// ── Scoring rubric (kept in sync with ScoringBreakdown in types.ts) ───────────
const SCORING_RUBRIC = `
SCORING RUBRIC — evaluate EACH category independently and BE STRICT:

1. marketNeed (max 25 pts)
   - 20–25: Massive, proven, urgent pain point with large addressable market
   - 14–19: Real problem but market size or urgency is moderate
   - 8–13:  Niche problem or unclear whether enough people face it
   - 0–7:   Weak or manufactured problem, very limited demand

2. revenuePotential (max 20 pts)
   - 16–20: Multiple clear monetization paths with high willingness to pay
   - 10–15: One solid revenue model but limited upsell potential
   - 5–9:   Uncertain monetization, commoditized pricing pressure
   - 0–4:   No clear path to revenue or very low margins

3. competitionAdvantage (max 15 pts)
   - 12–15: Strong defensible moat (network effects, proprietary data, patents)
   - 8–11:  Meaningful differentiation but competitors can replicate
   - 4–7:   Minor differentiation in a crowded market
   - 0–3:   Commodity space, no discernible advantage

4. technicalFeasibility (max 15 pts)
   - 12–15: Buildable with current technology, low R&D risk
   - 8–11:  Feasible but requires some hard engineering or novel AI work
   - 4–7:   Significant technical uncertainty or dependency on unproven tech
   - 0–3:   Requires breakthrough technology not yet available

5. scalability (max 15 pts)
   - 12–15: Near-zero marginal cost to serve additional users; global potential
   - 8–11:  Scales but with some operational overhead
   - 4–7:   Linear cost scaling limits growth ceiling
   - 0–3:   Fundamentally manual/local/geography-bound

6. innovation (max 10 pts)
   - 8–10: Novel approach, new category, or disruptive business model
   - 5–7:  Incremental improvement on existing solutions
   - 2–4:  Me-too product with minimal innovation
   - 0–1:  Direct copy of existing products

SCORING BANDS:
  95–100: Extremely rare — once-in-a-decade company
  85–94:  Exceptional — top 5% of startups
  70–84:  Strong — clear path to success with focused execution
  50–69:  Average — viable but requires significant differentiation
  0–49:   Weak — fundamental issues with market or model

IMPORTANT: Different ideas MUST receive different scores. Evaluate each idea
on its own merits against the rubric above. Do NOT default to 70–80 for
everything. A to-do app is a 32; a breakthrough biotech platform is a 91.`;

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Atlas AI, an elite startup advisor (think Y Combinator partner or top-tier VC analyst).
Analyze the provided startup idea with extreme depth, investor-grade quality, and brutal honesty.
AVOID generic buzzwords. Every point MUST be highly specific to the exact startup idea provided.

IMPORTANT UI FORMATTING RULES:
1. Keep content concise and investor-friendly. Prioritize clarity over detail. Avoid long paragraphs.
2. Use concise startup-investor language. Every section must fit comfortably inside dashboard cards without scrolling.
3. SWOT items: Maximum 20 words per item. One sentence only.
4. MVP Features: One short explanation (max 15 words).
5. Revenue Models: One-line explanation (max 20 words).
6. Key Risks: One-line explanation (max 20 words).
7. Investor Pitch: Max 2 sentences each for Hook, Problem, Solution, Market, and Ask.


${SCORING_RUBRIC}

The JSON must conform exactly to this schema:
{
  "marketNeed": <integer 0-25>,
  "revenuePotential": <integer 0-20>,
  "competitionAdvantage": <integer 0-15>,
  "technicalFeasibility": <integer 0-15>,
  "scalability": <integer 0-15>,
  "innovation": <integer 0-10>,
  "topStrength": "<1 short sentence, max 12 words>",
  "topConcern": "<1 short sentence, max 12 words>",
  "problemStatement": "<one concise paragraph describing the core problem>",
  "targetAudience": "<one concise paragraph describing who this is for>",
  "swot": {
    "strengths": ["<string> (Max 20 words, 1 sentence, specific reasoning)", "... (must be exactly 5)"],
    "weaknesses": ["<string> (Max 20 words, 1 sentence)", "... (exactly 5)"],
    "opportunities": ["<string> (Max 20 words, 1 sentence)", "... (exactly 5)"],
    "threats": ["<string> (Max 20 words, 1 sentence)", "... (exactly 5)"]
  },
  "mvpFeatures": [
    { "name": "<feature name>", "description": "<Max 15 words>" }
  ], // 5 to 8 features
  "revenueModel": [
    { 
      "streamName": "<Primary/Secondary/Enterprise revenue stream>", 
      "whoPays": "<Specific customer>", 
      "whyTheyPay": "<Max 20 words explanation>", 
      "potential": "<High | Medium | Low>" 
    }
  ], // Minimum 5 recommendations
  "keyRisks": [
    { "risk": "<Specific risk>", "impact": "<Max 20 words explanation>" }
  ], // Exactly 5 risks
  "investorPitch": {
    "hook": "<Max 25 words>",
    "problem": "<Max 25 words>",
    "solution": "<Max 25 words>",
    "market": "<Max 25 words>",
    "ask": "<Max 25 words. MUST NOT BE BLANK.>"
  }
}

Rules:
- Be brutally honest and specific. NO generic fluff.
- Adhere STRICTLY to the length limits (words/sentences) to prevent UI overflow.
- "theAsk" in investorPitch is MANDATORY. Always recommend a realistic funding amount and use of funds, even for weak ideas.
- Provide exactly 5 strengths, 5 weaknesses, 5 opportunities, 5 threats.
- Provide 5 to 8 MVP features.
- Provide at least 5 revenue streams (mix of primary, secondary, enterprise).
- Provide exactly 5 key risks.
- Respond ONLY with the JSON object.`;

// ── Groq client factory (lazy, reads env per-call for Cloudflare compatibility)
function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY environment variable is not set. Add it to your .env file.",
    );
  }
  return new Groq({ apiKey });
}

// ── Fallback & Validation helpers ──────────────────────────────────────────────
function fallbackString(val: unknown, fallback: string): string {
  if (typeof val === "string" && val.trim().length > 0) return val.trim();
  return fallback;
}

function fallbackStringArray(arr: unknown, count: number, prefix: string): string[] {
  let result: string[] = [];
  if (Array.isArray(arr)) {
    result = arr.map(x => (typeof x === "string" && x.trim() ? x.trim() : "")).filter(Boolean);
  }
  while (result.length < count) {
    result.push(`${prefix} ${result.length + 1}`);
  }
  return result.slice(0, Math.max(result.length, count));
}

function fallbackArray<T>(
  arr: unknown,
  min: number,
  mapper: (item: unknown, i: number) => T,
  defaultGenerator: (i: number) => T
): T[] {
  let result: T[] = [];
  if (Array.isArray(arr)) {
    result = arr.map((x, i) => mapper(x, i));
  }
  while (result.length < min) {
    result.push(defaultGenerator(result.length));
  }
  return result;
}

function requireScore(obj: Record<string, unknown>, key: string, max: number): number {
  const raw = obj[key];
  const n = Number(raw);
  if (!Number.isFinite(n)) return Math.floor(max / 2); // safe default
  return Math.round(Math.max(0, Math.min(max, n)));
}

function validateStartupAnalysis(data: unknown): StartupAnalysis {
  if (typeof data !== "object" || data === null) {
    throw new Error("Groq response is not an object.");
  }

  const d = data as Record<string, unknown>;

  // ── Validate each scoring category ──────────────────────────────────────────
  const marketNeed           = requireScore(d, "marketNeed", 25);
  const revenuePotential     = requireScore(d, "revenuePotential", 20);
  const competitionAdvantage = requireScore(d, "competitionAdvantage", 15);
  const technicalFeasibility = requireScore(d, "technicalFeasibility", 15);
  const scalability          = requireScore(d, "scalability", 15);
  const innovation           = requireScore(d, "innovation", 10);

  // ── Derive validationScore as authoritative sum ───
  const validationScore =
    marketNeed + revenuePotential + competitionAdvantage +
    technicalFeasibility + scalability + innovation;

  // ── SWOT ──────────────────────────────────────────────────────────────
  const swotRaw = d.swot || {};
  const s = typeof swotRaw === "object" ? (swotRaw as Record<string, unknown>) : {};
  const swot = {
    strengths:     fallbackStringArray(s.strengths, 5, "Identified strength"),
    weaknesses:    fallbackStringArray(s.weaknesses, 5, "Identified weakness"),
    opportunities: fallbackStringArray(s.opportunities, 5, "Identified opportunity"),
    threats:       fallbackStringArray(s.threats, 5, "Identified threat"),
  };

  // ── MVP ───────────────────────────────────────────────────────────────
  const mvpFeatures = fallbackArray<MVPFeature>(
    d.mvpFeatures,
    5,
    (item: unknown, i: number) => {
      const o = typeof item === "object" && item ? (item as any) : {};
      return {
        name: fallbackString(o.name, `Feature ${i + 1}`),
        description: fallbackString(o.description, "Core value delivery feature."),
      };
    },
    (i) => ({ name: `Feature ${i + 1}`, description: "Core value delivery feature." })
  );

  // ── Revenue ───────────────────────────────────────────────────────────
  const revenueModel = fallbackArray<RevenueStream>(
    d.revenueModel,
    5,
    (item: unknown, i: number) => {
      const o = typeof item === "object" && item ? (item as any) : {};
      const pot = fallbackString(o.potential, "Medium");
      return {
        streamName: fallbackString(o.streamName, `Revenue Stream ${i + 1}`),
        whoPays: fallbackString(o.whoPays, "Target audience"),
        whyTheyPay: fallbackString(o.whyTheyPay, "Provides clear value"),
        potential: ["Low", "Medium", "High"].includes(pot) ? (pot as any) : "Medium",
      };
    },
    (i) => ({
      streamName: `Revenue Stream ${i + 1}`,
      whoPays: "Target audience",
      whyTheyPay: "Provides clear value",
      potential: "Medium",
    })
  );

  // ── Risks ─────────────────────────────────────────────────────────────
  const keyRisks = fallbackArray<KeyRisk>(
    d.keyRisks,
    5,
    (item: unknown, i: number) => {
      const o = typeof item === "object" && item ? (item as any) : {};
      return {
        risk: fallbackString(o.risk, `Risk ${i + 1}`),
        impact: fallbackString(o.impact, "Requires strategic mitigation."),
      };
    },
    (i) => ({ risk: `Risk ${i + 1}`, impact: "Requires strategic mitigation." })
  );

  // ── Pitch ─────────────────────────────────────────────────────────────
  const ipRaw = d.investorPitch || {};
  const ip = typeof ipRaw === "object" ? (ipRaw as any) : {};
  const investorPitch: InvestorPitch = {
    hook: fallbackString(ip.hook, "A compelling new solution for a growing market."),
    problem: fallbackString(ip.problem, "A clear problem exists in this market."),
    solution: fallbackString(ip.solution, "We offer a streamlined solution."),
    market: fallbackString(ip.market, "Large, growing market demand."),
    ask: fallbackString(ip.ask, "We are seeking seed funding to accelerate development and capture market share."),
  };

  return {
    marketNeed,
    revenuePotential,
    competitionAdvantage,
    technicalFeasibility,
    scalability,
    innovation,
    validationScore,
    topStrength: fallbackString(d.topStrength, "Clear value proposition."),
    topConcern: fallbackString(d.topConcern, "Execution risk."),
    problemStatement: fallbackString(d.problemStatement, "Addressing a significant market need."),
    targetAudience: fallbackString(d.targetAudience, "Primary users and decision makers."),
    swot,
    mvpFeatures,
    revenueModel,
    keyRisks,
    investorPitch,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function analyzeStartupIdea(idea: string): Promise<StartupAnalysis> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this startup idea:\n\n${idea.trim()}`,
      },
    ],
    // Slightly higher temperature encourages differentiated scores across ideas
    temperature: 0.7,
    max_tokens: 3000,
    // Force JSON-only output — prevents the model from wrapping in markdown
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq returned an empty response. Please try again.");
  }

  // ── Safe JSON parse ────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Attempt to extract a JSON object if the model wrapped it in prose
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        "Groq response did not contain valid JSON. Please try again.",
      );
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(
        "Failed to parse the JSON extracted from Groq response. Please try again.",
      );
    }
  }

  return validateStartupAnalysis(parsed);
}
