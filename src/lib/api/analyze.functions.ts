// ─── TanStack Start server function — Groq analysis ──────────────────────────
// createServerFn runs exclusively on the server. The `.handler` body (and any
// module-level imports used only inside it, like groq.server.ts) are
// tree-shaken from the client bundle by Vite/Nitro.
//
// Usage from the client:
//   const result = await analyzeIdea({ data: { idea: "my startup idea" } });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeStartupIdea } from "@/services/groq.server";

const inputSchema = z.object({
  idea: z.string().min(10, "Please describe your idea in at least a sentence."),
});

export const analyzeIdea = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    return await analyzeStartupIdea(data.idea);
  });
