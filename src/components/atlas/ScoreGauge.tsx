import { motion } from "framer-motion";

export function ScoreGauge({ score }: { score: number }) {
  const displayScore = Math.round(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative size-44">
      <svg className="size-full -rotate-90" viewBox="0 0 160 160">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.68 0.19 250)" />
            <stop offset="100%" stopColor="oklch(0.65 0.22 295)" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          stroke="url(#g)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-4xl font-semibold tracking-tight text-gradient"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {displayScore}
        </motion.div>
        <div className="text-xs text-muted-foreground">Validation score</div>
      </div>
    </div>
  );
}
