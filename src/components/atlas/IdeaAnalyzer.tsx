import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { analyzeStartupIdeaFn } from "@/lib/api/groq.functions";
import { type SavedAnalysis, type StartupIdeaAnalysis, sampleIdeas } from "@/lib/atlas/analysis";
import { getSafeDefaultAnalysis } from "@/services/groq-analysis";
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
  const search = useSearch({ strict: false }) as { id?: string };
  const navigate = useNavigate();

  useEffect(() => {
    const loaded = readSavedAnalyses();
    setSavedAnalyses(loaded);

    if (search.id) {
      const found = loaded.find((item) => item.id === search.id);
      if (found) {
        setIdea(found.idea);
        setAnalysis(found.analysis);
      } else {
        toast.error("Failed to load analysis");
      }
      navigate({ to: "/", search: { id: undefined }, replace: true });
    }
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
      const result = await analyzeStartupIdeaFn({ data: { idea: trimmedIdea } });
      if (requestIdRef.current !== requestId) return;

      console.log("Analysis Result:", result);

      if (!result || typeof result.validationScore !== "number") {
        toast.error("Invalid AI response received.");
        return;
      }

      setAnalysis(result);

      const nextSaved = [
        {
          id: crypto.randomUUID(),
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <div className="mx-auto flex w-full flex-col px-4 py-10 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mx-auto flex w-full flex-col items-center text-center mt-12 mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.1em] text-slate-300">
            <Sparkles className="h-4 w-4" />
            AI Co-Founder · Beta
          </div>

          <div className="mt-8 space-y-6 max-w-4xl">
            <h1 className="text-5xl font-bold tracking-tight text-white md:text-[72px] md:leading-[1.1]">
              Validate Your Startup <br className="hidden md:block" /> Idea <span className="text-indigo-400">with AI</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Atlas AI guides you from raw idea to investor-ready plan — validation score, SWOT,
              MVP scope, revenue model, and pitch in seconds.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full md:w-[85%] max-w-5xl rounded-[28px] border border-white/10 bg-[#081225] p-8 shadow-2xl min-h-[280px] flex flex-col justify-between">
          <div>
            <textarea
              ref={textareaRef}
              id="startup-idea"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Describe your startup idea... e.g. 'An AI copilot for indie e-commerce brands to forecast inventory.'"
              rows={3}
              className="w-full resize-none overflow-hidden bg-transparent text-lg leading-relaxed text-white outline-none placeholder:text-slate-500"
            />
          </div>
          
          <div className="mt-8">
            <div className="flex flex-wrap gap-2 mb-6">
              {sampleIdeas.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setIdea(sample)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="truncate max-w-[250px] sm:max-w-[350px]">{sample}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || !idea.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 px-8 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze My Idea
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mx-auto mt-8 flex max-w-5xl items-center justify-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-6 py-4 text-sm text-indigo-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingMessages[loadingStep]}
          </div>
        )}

        <div className={`mt-16 w-full mx-auto transition-all duration-300 ${loading ? 'opacity-40 blur-sm pointer-events-none' : 'opacity-100'}`}>
          <ResultCards analysis={analysis || getSafeDefaultAnalysis()} />
        </div>
      </div>
    </div>
  );
}
