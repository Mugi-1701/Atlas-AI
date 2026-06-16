import { motion } from "framer-motion";
import { TrendingUp, ShieldAlert, Lightbulb, AlertTriangle, Rocket, DollarSign, Presentation, Check } from "lucide-react";
import { type Analysis } from "@/lib/atlas/mock";
import { ScoreGauge } from "./ScoreGauge";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`glass-card rounded-2xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="size-8 rounded-lg flex items-center justify-center border border-border"
        style={{ background: accent ?? "color-mix(in oklab, var(--primary) 14%, transparent)" }}
      >
        <Icon className="size-4" />
      </div>
      <h3 className="font-semibold tracking-tight">{label}</h3>
    </div>
  );
}

export function ResultCards({ analysis }: { analysis: Analysis }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-6 gap-5">
      {/* Validation score */}
      <Card className="lg:col-span-2">
        <CardTitle icon={TrendingUp} label="Validation Score" />
        <div className="flex flex-col items-center gap-3">
          <ScoreGauge score={analysis.score} />
          <p className="text-sm text-center text-muted-foreground leading-relaxed">{analysis.verdict}</p>
        </div>
      </Card>

      {/* SWOT */}
      <Card className="lg:col-span-4">
        <CardTitle icon={ShieldAlert} label="SWOT Analysis" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SwotBlock title="Strengths" tone="success" items={analysis.swot.strengths} />
          <SwotBlock title="Weaknesses" tone="warning" items={analysis.swot.weaknesses} />
          <SwotBlock title="Opportunities" tone="primary" items={analysis.swot.opportunities} />
          <SwotBlock title="Threats" tone="destructive" items={analysis.swot.threats} />
        </div>
      </Card>

      {/* MVP */}
      <Card className="lg:col-span-3">
        <CardTitle icon={Rocket} label="MVP Recommendation" />
        <ul className="space-y-3">
          {analysis.mvp.map((m) => (
            <li key={m.feature} className="flex items-start gap-3">
              <span
                className={`mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border ${
                  m.priority === "P0" ? "text-foreground" : "text-muted-foreground"
                }`}
                style={m.priority === "P0" ? { background: "var(--gradient-primary)", color: "var(--primary-foreground)", border: "none" } : {}}
              >
                {m.priority}
              </span>
              <div>
                <div className="text-sm font-medium">{m.feature}</div>
                <div className="text-xs text-muted-foreground">{m.rationale}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Revenue */}
      <Card className="lg:col-span-3">
        <CardTitle icon={DollarSign} label="Revenue Model" />
        <div className="space-y-3">
          {analysis.revenue.map((r) => (
            <div key={r.model} className="rounded-xl border border-border p-3 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-sm">{r.model}</div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground"
                  style={
                    r.potential === "High"
                      ? { color: "var(--success)", borderColor: "color-mix(in oklab, var(--success) 40%, transparent)" }
                      : r.potential === "Medium"
                        ? { color: "var(--warning)", borderColor: "color-mix(in oklab, var(--warning) 40%, transparent)" }
                        : {}
                  }
                >
                  {r.potential} potential
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pitch */}
      <Card className="lg:col-span-6">
        <CardTitle icon={Presentation} label="Investor Pitch" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <PitchBlock label="Hook" value={analysis.pitch.hook} highlight />
          <PitchBlock label="Problem" value={analysis.pitch.problem} />
          <PitchBlock label="Solution" value={analysis.pitch.solution} />
          <PitchBlock label="Market" value={analysis.pitch.market} />
          <PitchBlock label="The Ask" value={analysis.pitch.ask} highlight />
        </div>
      </Card>
    </motion.div>
  );
}

function SwotBlock({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" | "primary" | "destructive" }) {
  const colorVar =
    tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : tone === "destructive" ? "var(--destructive)" : "var(--primary)";
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="size-1.5 rounded-full" style={{ background: colorVar }} />
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      </div>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm">
            {tone === "success" ? (
              <Check className="size-3.5 mt-0.5 shrink-0" style={{ color: colorVar }} />
            ) : tone === "primary" ? (
              <Lightbulb className="size-3.5 mt-0.5 shrink-0" style={{ color: colorVar }} />
            ) : (
              <AlertTriangle className="size-3.5 mt-0.5 shrink-0" style={{ color: colorVar }} />
            )}
            <span className="text-foreground/90">{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PitchBlock({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "border-primary/30" : "border-border"}`} style={highlight ? { background: "color-mix(in oklab, var(--primary) 8%, transparent)" } : {}}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="text-sm leading-relaxed">{value}</div>
    </div>
  );
}