import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { StartupIdeaAnalysis } from "@/lib/atlas/analysis";
import { ScoreGauge } from "./ScoreGauge";

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
      className={`flex flex-col h-full rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#081225] p-8 shadow-[0_4px_40px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_50px_rgba(0,0,0,0.3)] ${className}`}
    >
      <h3 className="text-[22px] font-semibold text-white mb-6 shrink-0">{title}</h3>
      <div className="flex-1 flex flex-col text-[15px] leading-relaxed text-slate-300">
        {children}
      </div>
    </motion.section>
  );
}

function ListBlock({ items }: { items: string[] }) {
  const displayItems = items.slice(0, 5);
  return (
    <ul className="space-y-3 flex-1 flex flex-col justify-start">
      {displayItems.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="relative pl-5 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-indigo-400 text-[15px] text-slate-300"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ResultCards({ analysis }: ResultCardsProps) {
  const truncatedSummary = analysis.validationSummary.length > 300 ? analysis.validationSummary.slice(0, 297) + '...' : analysis.validationSummary;
  const truncatedPitch = analysis.investorPitch.split(' ').slice(0, 120).join(' ') + (analysis.investorPitch.split(' ').length > 120 ? '...' : '');

  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-10">
      <div className="md:col-span-4 h-[440px]">
        <Card title="Validation Score" className="items-center text-center">
          <div className="flex-1 flex items-center justify-center min-h-[220px] mb-4 shrink-0">
            <ScoreGauge score={analysis.validationScore} />
          </div>
          <p className="text-slate-300 line-clamp-3 text-[15px] leading-relaxed">
            {truncatedSummary}
          </p>
        </Card>
      </div>

      <div className="md:col-span-6 min-h-[440px] h-auto">
        <Card title="SWOT Analysis" className="h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 h-full">
            <div className="flex flex-col">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-400 shrink-0">
                Strengths
              </p>
              <ListBlock items={analysis.strengths} />
            </div>
            <div className="flex flex-col">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-rose-400 shrink-0">
                Weaknesses
              </p>
              <ListBlock items={analysis.weaknesses} />
            </div>
            <div className="flex flex-col">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-sky-400 shrink-0">
                Opportunities
              </p>
              <ListBlock items={analysis.opportunities} />
            </div>
            <div className="flex flex-col">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber-400 shrink-0">
                Threats
              </p>
              <ListBlock items={analysis.threats} />
            </div>
          </div>
        </Card>
      </div>

      <div className="md:col-span-5 min-h-[340px] h-auto">
        <Card title="MVP Features">
          <ListBlock items={analysis.mvpFeatures} />
        </Card>
      </div>

      <div className="md:col-span-5 min-h-[340px] h-auto">
        <Card title="Revenue Model">
          <ListBlock items={analysis.revenueModel} />
        </Card>
      </div>

      <div className="md:col-span-10 h-[280px]">
        <Card title="Key Risks">
          <ListBlock items={analysis.keyRisks} />
        </Card>
      </div>

      <div className="md:col-span-10 h-[220px]">
        <Card title="Investor Pitch">
          <p className="text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap max-w-4xl line-clamp-4">
            {truncatedPitch}
          </p>
        </Card>
      </div>
    </div>
  );
}
