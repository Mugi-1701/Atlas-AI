import { createFileRoute } from "@tanstack/react-router";
import { IdeaAnalyzer } from "@/components/atlas/IdeaAnalyzer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas AI — Idea Analyzer" },
      { name: "description", content: "Describe your startup idea and get instant validation, SWOT, MVP, revenue model, and pitch." },
      { property: "og:title", content: "Atlas AI — Idea Analyzer" },
      { property: "og:description", content: "Describe your startup idea and get instant validation, SWOT, MVP, revenue model, and pitch." },
    ],
  }),
  component: Index,
});

function Index() {
  return <IdeaAnalyzer />;
}
