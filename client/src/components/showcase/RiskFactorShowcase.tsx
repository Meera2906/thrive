/**
 * RiskFactorShowcase
 * Renders 4 stacked CardSwap cards — one per risk tier — with live counts
 * from /api/stats. Clicking a card navigates to /dashboard?tier=<TierName>.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import CardSwap, { Card } from "./CardSwap";
import { StatsResponse } from "../../types";

interface TierConfig {
  tier: string;
  label: string;
  description: string;
  Icon: React.ElementType;
  cardClass: string;
  iconClass: string;
  countClass: string;
  borderClass: string;
  getCount: (s: StatsResponse) => number;
}

const TIERS: TierConfig[] = [
  {
    tier: "High",
    label: "High Risk",
    description: "Patients at serious risk of dropping out — contact immediately.",
    Icon: AlertTriangle,
    cardClass: "bg-red-950/90 backdrop-blur-sm",
    iconClass: "text-red-400",
    countClass: "text-red-300",
    borderClass: "border-red-800",
    getCount: (s) => s.high,
  },
  {
    tier: "Medium",
    label: "Medium Risk",
    description: "Elevated risk factors — schedule proactive outreach soon.",
    Icon: AlertCircle,
    cardClass: "bg-amber-950/90 backdrop-blur-sm",
    iconClass: "text-amber-400",
    countClass: "text-amber-300",
    borderClass: "border-amber-800",
    getCount: (s) => s.medium,
  },
  {
    tier: "Low",
    label: "Low Risk",
    description: "On track — routine follow-up cadence is sufficient.",
    Icon: CheckCircle2,
    cardClass: "bg-teal-950/90 backdrop-blur-sm",
    iconClass: "text-teal-400",
    countClass: "text-teal-300",
    borderClass: "border-teal-800",
    getCount: (s) => s.low,
  },
  {
    tier: "Insufficient history",
    label: "Insufficient History",
    description: "Fewer than 2 appointments recorded — cannot yet be scored.",
    Icon: HelpCircle,
    cardClass: "bg-slate-800/90 backdrop-blur-sm",
    iconClass: "text-slate-400",
    countClass: "text-slate-300",
    borderClass: "border-slate-700",
    getCount: (s) => s.insufficientHistory,
  },
];

export default function RiskFactorShowcase() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {/* stats optional for landing page */});
  }, []);

  const handleCardClick = (idx: number) => {
    const tierName = TIERS[idx].tier;
    navigate(`/dashboard?tier=${encodeURIComponent(tierName)}`);
  };

  return (
    <div className="flex justify-center items-center">
      <CardSwap
        width={340}
        height={230}
        cardDistance={55}
        verticalDistance={12}
        delay={4}
        pauseOnHover
        skewAmount={5}
        easing="elastic.out(1,0.5)"
        onCardClick={handleCardClick}
      >
        {TIERS.map((t) => (
          <Card
            key={t.tier}
            customClass={`${t.cardClass} ${t.borderClass} p-6 flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${t.iconClass}`}>
                  {t.label}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed max-w-[220px]">
                  {t.description}
                </p>
              </div>
              <t.Icon size={28} className={`${t.iconClass} shrink-0 ml-2 mt-0.5`} />
            </div>

            <div className="flex items-end justify-between mt-4">
              <div>
                <div className={`text-4xl font-black tabular-nums ${t.countClass}`}>
                  {stats ? t.getCount(stats) : "—"}
                </div>
                <div className="text-slate-500 text-xs mt-0.5">patients</div>
              </div>
              <div className={`text-xs font-medium px-3 py-1 rounded-full border ${t.borderClass} ${t.iconClass} opacity-70`}>
                Click to filter →
              </div>
            </div>
          </Card>
        ))}
      </CardSwap>
    </div>
  );
}
