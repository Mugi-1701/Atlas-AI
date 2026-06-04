import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Inbox } from "lucide-react";
import { PageHeader } from "@/components/atlas/PageHeader";
import type { SavedAnalysis } from "@/lib/atlas/analysis";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Previous Analyses — Atlas AI" },
      { name: "description", content: "Browse your past startup analyses." },
    ],
  }),
  component: History,
});

function History() {
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("atlas.history.v1");
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <PageHeader
        title="Previous Analyses"
        subtitle="Everything you've explored with Atlas — saved locally for now."
      />
      <div className="px-4 md:px-8 pb-16 max-w-6xl mx-auto">
        {items.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground" />
            <div className="mt-3 font-medium">No analyses yet</div>
            <div className="text-sm text-muted-foreground">
              Run your first analysis to see it here.
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-lg text-sm text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Start analyzing <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((it, i) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(it.createdAt).toLocaleString()}</span>
                  <span className="text-gradient font-semibold">{it.analysis.score}/100</span>
                </div>
                <p className="mt-2 text-sm line-clamp-3">{it.analysis.idea}</p>
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                  {it.analysis.verdict}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
