import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { StartupIdeaAnalysis } from "@/lib/atlas/analysis";

interface ResultCardsProps {
  analysis: StartupIdeaAnalysis;
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`h-full rounded-3xl border border-[rgba(139,92,246,0.15)] bg-[rgba(15,23,42,0.85)] p-6 shadow-[0_16px_40px_rgba(88,28,135,0.16)] backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(126,34,206,0.22)] ${className}`}
    >
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-4 text-sm leading-6 text-slate-200">
        {children}
      </div>
    </motion.section>
  );
}

function ListBlock({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-slate-200"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ResultCards({ analysis }: ResultCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Validation Score">
        <p className="text-slate-300">{analysis.validationSummary}</p>
      </Card>

      <Card title="SWOT Analysis">
        <div className="grid gap-5">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-200">
              Strengths
            </p>
            <ListBlock items={analysis.strengths} />
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-200">
              Weaknesses
            </p>
            <ListBlock items={analysis.weaknesses} />
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-200">
              Opportunities
            </p>
            <ListBlock items={analysis.opportunities} />
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-cyan-200">
              Threats
            </p>
            <ListBlock items={analysis.threats} />
          </div>
        </div>
      </Card>

      <Card title="MVP Features">
        <ListBlock items={analysis.mvpFeatures} />
      </Card>

      <Card title="Revenue Model">
        <ListBlock items={analysis.revenueModel} />
      </Card>

      <Card title="Key Risks">
        <ListBlock items={analysis.keyRisks} />
      </Card>

      <Card title="Investor Pitch">
        <p className="text-slate-200">{analysis.investorPitch}</p>
      </Card>
    </div>
  );
}
