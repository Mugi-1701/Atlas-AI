import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, PlayCircle, Sparkles, Wand2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sampleIdeas, type Analysis, type SavedAnalysis, adaptGroqToAnalysis } from "@/lib/atlas/mock";
import { analyzeIdea } from "@/lib/api/analyze.functions";
import { ResultCards } from "./ResultCards";

const STORAGE_KEY = "atlas.history.v1";

function saveToHistory(a: Analysis) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: SavedAnalysis[] = raw ? JSON.parse(raw) : [];
    list.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), analysis: a });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 25)));
  } catch {
    // ignore
  }
}

export function IdeaAnalyzer({ initialId }: { initialId?: string }) {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (initialId) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: SavedAnalysis[] = JSON.parse(raw);
          const found = list.find((item) => item.id === initialId);
          if (found) {
            setIdea(found.analysis.idea);
            setAnalysis(found.analysis);
            return;
          }
        }
        throw new Error("Analysis not found");
      } catch (err) {
        toast.error("Failed to load analysis");
      }
    }
  }, [initialId]);

  async function runAnalysis(text: string) {
    if (text.trim().length < 10) {
      toast.error("Add a bit more detail", { description: "Describe your idea in at least a sentence." });
      return;
    }
    setLoading(true);
    setAnalysis(null);

    try {
      // Call Groq via the TanStack Start server function (server-side only)
      const groqResult = await analyzeIdea({ data: { idea: text.trim() } });

      // Adapt Groq's response shape into the existing Analysis shape used by all UI components
      const a = adaptGroqToAnalysis(groqResult, text.trim());

      setAnalysis(a);
      saveToHistory(a);
      toast.success("Analysis ready", { description: `Validation score: ${a.score}/100` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error("Analysis failed", { description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="px-4 md:px-8 pt-10 md:pt-16 pb-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-border bg-card/60 mb-5">
            <Sparkles className="size-3" /> AI Co-Founder · Beta
          </span>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Validate Your Startup
            <br />
            Idea <span className="text-gradient">with AI</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Atlas AI guides you from raw idea to investor-ready plan — validation score, SWOT, MVP scope, revenue model, and pitch in seconds.
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 glass-card rounded-2xl p-2 md:p-3"
          style={{ boxShadow: "var(--shadow-elegant)" }}
        >
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your startup idea... e.g. 'An AI copilot for indie e-commerce brands to forecast inventory.'"
            rows={4}
            className="w-full bg-transparent resize-none outline-none px-4 py-3 text-base placeholder:text-muted-foreground/70"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-2">
            <div className="flex flex-wrap gap-2">
              {sampleIdeas.map((s) => (
                <button
                  key={s}
                  onClick={() => setIdea(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Wand2 className="inline size-3 mr-1" />
                  {s.length > 60 ? s.slice(0, 60) + "…" : s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => runAnalysis(idea)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-lg text-primary-foreground disabled:opacity-70"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Analyzing
                  </>
                ) : (
                  <>
                    Analyze My Idea <ArrowRight className="size-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Results */}
      <section className="px-4 md:px-8 pb-16 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {loading && <LoadingState key="loading" />}
          {!loading && analysis && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultCards analysis={analysis} />
            </motion.div>
          )}
          {!loading && !analysis && <EmptyState key="empty" />}
        </AnimatePresence>
      </section>

      {/* Demo modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/60 backdrop-blur-md"
            onClick={() => setShowDemo(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Quick demo</div>
                  <h3 className="text-xl font-semibold tracking-tight mt-1">See Atlas in action</h3>
                </div>
                <button onClick={() => setShowDemo(false)} className="p-1 rounded hover:bg-card">
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                We&apos;ll run a full analysis on a sample idea so you can preview the output.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowDemo(false)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-card">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const demo = sampleIdeas[0];
                    setIdea(demo);
                    setShowDemo(false);
                    runAnalysis(demo);
                  }}
                  className="px-4 py-2 text-sm rounded-lg text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Run sample analysis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingState() {
  const labels = ["Parsing idea", "Scoring market signal", "Drafting SWOT", "Composing pitch"];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="relative size-9">
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "var(--primary)", opacity: 0.25 }} />
            <span className="absolute inset-1 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          </div>
          <div>
            <div className="text-sm font-medium">Atlas is thinking…</div>
            <div className="text-xs text-muted-foreground">Structured analysis usually takes a few seconds.</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          {labels.map((l, i) => (
            <motion.div
              key={l}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
              className="text-[11px] px-2.5 py-1.5 rounded-md border border-border bg-card/50"
            >
              {l}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
        {(["lg:col-span-2", "lg:col-span-4", "lg:col-span-3", "lg:col-span-3", "lg:col-span-6"] as const).map((cls, i) => (
          <div key={i} className={`glass-card rounded-2xl p-6 h-40 overflow-hidden relative ${cls}`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]" style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.06), transparent)" }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </motion.div>
  );
}

function EmptyState() {
  const items = [
    { title: "Validation Score", desc: "A weighted signal across market, novelty, and feasibility." },
    { title: "SWOT", desc: "Strengths, weaknesses, opportunities, and threats — instantly." },
    { title: "MVP scope", desc: "P0 to P2 features so you ship the right thing first." },
    { title: "Revenue model", desc: "Pricing strategies tuned to your category." },
    { title: "Investor pitch", desc: "A founder-ready narrative you can read on stage." },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{`0${i + 1}`}</div>
            <div className="font-medium mt-1">{it.title}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{it.desc}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}