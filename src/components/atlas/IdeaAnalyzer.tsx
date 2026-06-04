import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { analyzeStartupIdeaFn } from "@/lib/api/groq.functions";
import { type SavedAnalysis, type StartupIdeaAnalysis } from "@/lib/atlas/analysis";
import { ResultCards } from "./ResultCards";

const STORAGE_KEY = "atlas-ai-analysis-history";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const loadingMessages = [
  "Validating startup idea...",
  "Analyzing market potential...",
  "Generating SWOT analysis...",
  "Building MVP roadmap...",
  "Evaluating revenue opportunities...",
  "Drafting investor pitch...",
];

function normalizeIdea(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function readSavedAnalyses(): SavedAnalysis[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SavedAnalysis[];
    const now = Date.now();

    return parsed.filter((item) => item?.timestamp && now - item.timestamp < CACHE_TTL_MS);
  } catch {
    return [];
  }
}

function writeSavedAnalyses(items: SavedAnalysis[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function IdeaAnalyzer() {
  const [idea, setIdea] = useState("");
  const [analysis, setAnalysis] = useState<StartupIdeaAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const requestIdRef = useRef(0);
  const loadingTimerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setSavedAnalyses(readSavedAnalyses());
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [idea]);

  useEffect(() => {
    if (!loading) {
      if (loadingTimerRef.current) {
        window.clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setLoadingStep(0);
      return;
    }

    loadingTimerRef.current = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % loadingMessages.length);
    }, 1600);

    return () => {
      if (loadingTimerRef.current) {
        window.clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [loading]);

  const handleAnalyze = async () => {
    const trimmedIdea = idea.trim();

    if (!trimmedIdea) {
      toast.error("Please enter a startup idea before analyzing.");
      return;
    }

    const cacheKey = normalizeIdea(trimmedIdea);
    const cached = savedAnalyses.find((item) => item.ideaKey === cacheKey);

    if (cached) {
      setAnalysis(cached.analysis);
      toast.success("Loaded saved analysis.");
      return;
    }

    if (loading) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);

    try {
      const result = await analyzeStartupIdeaFn(trimmedIdea);

      if (requestIdRef.current !== requestId) return;

      console.log("Analysis Result:", result);

      if (!result || typeof result.validationScore !== "number") {
        toast.error("Invalid AI response received.");
        return;
      }

      setAnalysis(result);

      const nextSaved = [
        {
          idea: trimmedIdea,
          ideaKey: cacheKey,
          analysis: result,
          timestamp: Date.now(),
        },
        ...savedAnalyses.filter((item) => item.ideaKey !== cacheKey),
      ];

      setSavedAnalyses(nextSaved);
      writeSavedAnalyses(nextSaved);
    } catch (error) {
      console.error("Groq analysis failed", error);
      toast.error("AI analysis temporarily unavailable.");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-medium tracking-[0.2em] text-cyan-200 uppercase">
            <Sparkles className="h-4 w-4" />
            AI Co-Founder · Beta
          </div>

          <div className="mt-5 space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Validate Your Startup Idea with AI
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Atlas AI guides you from raw idea to investor-ready validation,
              SWOT analysis, MVP planning, revenue strategy, and investor
              pitch.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-6">
          <div className="space-y-4">
            <label
              htmlFor="startup-idea"
              className="text-sm font-medium text-slate-200"
            >
              Startup idea
            </label>
            <textarea
              ref={textareaRef}
              id="startup-idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Describe your startup idea..."
              rows={4}
              className="max-h-[420px] w-full resize-none overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 sm:text-base"
            />
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !idea.trim()}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  Analyze Startup
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {loadingMessages[loadingStep]}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {analysis ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
            >
              <ResultCards analysis={analysis} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
