// ─── Groq AI response schema ─────────────────────────────────────────────────
// This is the shape Groq is instructed to return. It is the single source of
// truth for the AI output — all other parts of the app adapt FROM this type.

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ScoringBreakdown {
  marketNeed: number;           // 0–25
  revenuePotential: number;     // 0–20
  competitionAdvantage: number; // 0–15
  technicalFeasibility: number; // 0–15
  scalability: number;          // 0–15
  innovation: number;           // 0–10
}

export interface MVPFeature {
  name: string;
  description: string;
}

export interface RevenueStream {
  streamName: string;
  whoPays: string;
  whyTheyPay: string;
  potential: "Low" | "Medium" | "High";
}

export interface KeyRisk {
  risk: string;
  impact: string;
}

export interface InvestorPitch {
  hook: string;
  problem: string;
  solution: string;
  market: string;
  ask: string;
}

export interface StartupAnalysis extends ScoringBreakdown {
  /** Sum of all category scores. Must equal the breakdown total. */
  validationScore: number;
  topStrength: string;
  topConcern: string;
  problemStatement: string;
  targetAudience: string;
  swot: SWOTAnalysis;
  mvpFeatures: MVPFeature[];
  revenueModel: RevenueStream[];
  keyRisks: KeyRisk[];
  investorPitch: InvestorPitch;
}
