import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { analyzeStartupIdea } from "@/services/groq-analysis";
import type { StartupIdeaAnalysis } from "@/lib/atlas/analysis";

export const analyzeStartupIdeaFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ idea: z.string().min(1) }))
  .handler(async ({ data }): Promise<StartupIdeaAnalysis> => {
    return analyzeStartupIdea(data.idea);
  });
