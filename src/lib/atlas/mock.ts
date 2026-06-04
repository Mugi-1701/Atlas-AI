export type Analysis = {
  idea: string;
  score: number;
  verdict: string;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  mvp: { feature: string; priority: "P0" | "P1" | "P2"; rationale: string }[];
  revenue: { model: string; description: string; potential: "Low" | "Medium" | "High" }[];
  pitch: { hook: string; problem: string; solution: string; market: string; ask: string };
};

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function generateAnalysis(idea: string): Analysis {
  const seed = idea.trim().length;
  const score = Math.min(94, 62 + ((seed * 7) % 30));

  return {
    idea,
    score,
    verdict:
      score > 85
        ? "Highly promising — strong signal of product-market fit potential."
        : score > 72
          ? "Promising — refine positioning and validate with target users."
          : "Early signal — requires sharper differentiation and validation.",
    swot: {
      strengths: [
        "Clear, articulable value proposition",
        "Addresses a recurring user pain point",
        "Low initial technical complexity",
        "Founder-market fit signal detected",
      ],
      weaknesses: [
        "Undefined go-to-market motion",
        "Crowded category with established incumbents",
        "Unit economics require validation",
      ],
      opportunities: [
        "Emerging AI tooling lowers build cost",
        "Underserved SMB segment",
        "Potential platform-to-marketplace evolution",
        "International expansion via product-led growth",
      ],
      threats: [
        "Fast-moving incumbents shipping similar features",
        "Regulatory headwinds in target verticals",
        "Customer acquisition cost volatility",
      ],
    },
    mvp: [
      { feature: "Core onboarding flow with magic link auth", priority: "P0", rationale: "Reduces activation friction." },
      { feature: "AI-assisted primary workflow", priority: "P0", rationale: "Delivers the headline value in <60s." },
      { feature: "Workspace + multi-user collaboration", priority: "P1", rationale: "Drives expansion revenue." },
      { feature: "Usage analytics dashboard", priority: "P1", rationale: "Surfaces value and retention hooks." },
      { feature: "API + Zapier integrations", priority: "P2", rationale: "Unlocks long-tail use cases." },
    ],
    revenue: [
      { model: "Freemium SaaS", description: "Free tier with usage caps; Pro at $19/mo, Team at $49/seat/mo.", potential: "High" },
      { model: "Usage-based pricing", description: "Pay-as-you-go on AI runs — aligns cost with value.", potential: "High" },
      { model: "Enterprise licensing", description: "Annual contracts with SSO, audit logs, dedicated support.", potential: "Medium" },
      { model: "Marketplace take-rate", description: "10–15% on third-party templates and integrations.", potential: "Low" },
    ],
    pitch: {
      hook: `${idea.split(/\s+/).slice(0, 6).join(" ") || "Your idea"} — reimagined for the AI era.`,
      problem: "Today, founders waste weeks validating ideas through scattered tools, gut feel, and consultant guesswork.",
      solution: "Atlas AI compresses that into minutes — structured validation, MVP scope, revenue design, and pitch-ready output.",
      market: "SAM: 30M+ founders and operators globally; TAM expanding 18% YoY as AI lowers the cost of company formation.",
      ask: "Raising $1.5M seed to ship v1, hit 1,000 paying teams, and reach $1M ARR within 14 months.",
    },
  };
}

export const sampleIdeas = [
  "A platform that helps remote teams run async standups with AI summaries",
  "An AI copilot for indie e-commerce brands to forecast inventory",
  "A marketplace connecting climate startups with vetted technical talent",
];