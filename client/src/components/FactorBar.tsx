import { motion } from "framer-motion";
import { ReasonContribution } from "../types";

function barColor(points: number, maxPoints: number): string {
  if (maxPoints === 0) return "bg-white/20";
  const ratio = points / maxPoints;
  if (ratio >= 0.66) return "bg-risk-high";
  if (ratio > 0) return "bg-risk-medium";
  return "bg-white/15";
}

export default function FactorBar({ reason }: { reason: ReasonContribution }) {
  const pct = reason.maxPoints > 0 ? (reason.points / reason.maxPoints) * 100 : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-white/80">{reason.label}</span>
        <span className="font-semibold text-white whitespace-nowrap ml-3">
          +{reason.points} pts
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor(reason.points, reason.maxPoints)}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="text-xs text-white/40 mt-0.5">
        {reason.points} / {reason.maxPoints} pts
      </div>
    </div>
  );
}
