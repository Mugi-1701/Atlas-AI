export type StartupIdeaAnalysis = {
  validationScore: number;
  validationSummary: string;
  marketNeed: number;
  differentiation: number;
  revenuePotential: number;
  scalability: number;
  technicalFeasibility: number;
  competition: number;
  timing: number;
  problemStatement: string;
  targetAudience: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  mvpFeatures: string[];
  revenueModel: string[];
  keyRisks: string[];
  investorPitch: string;
};

export type SavedAnalysis = {
  id: string;
  createdAt: string;
  analysis: StartupIdeaAnalysis;
};

export const sampleIdeas = [
  "A platform that helps remote teams run async standups with AI summaries",
  "An AI copilot for indie e-commerce brands to forecast inventory",
  "A marketplace connecting climate startups with vetted technical talent",
];
