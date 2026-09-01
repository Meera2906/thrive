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
    cardClass: "bg-red-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(220,38,38,0.25)]",
    iconClass: "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]",
    countClass: "text-red-300 drop-shadow-[0_0_12px_rgba(248,113,113,0.4)]",
    borderClass: "border-red-500/50",
    getCount: (s) => s.high,
  },
  {
    tier: "Medium",
    label: "Medium Risk",
    description: "Elevated risk factors — schedule proactive outreach soon.",
    Icon: AlertCircle,
    cardClass: "bg-amber-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(217,119,6,0.25)]",
    iconClass: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    countClass: "text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]",
    borderClass: "border-amber-500/50",
    getCount: (s) => s.medium,
  },
  {
    tier: "Low",
    label: "Low Risk",
    description: "On track — routine follow-up cadence is sufficient.",
    Icon: CheckCircle2,
    cardClass: "bg-teal-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(13,148,136,0.25)]",
    iconClass: "text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]",
    countClass: "text-teal-300 drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]",
    borderClass: "border-teal-500/50",
    getCount: (s) => s.low,
  },
  {
    tier: "Insufficient history",
    label: "Insufficient History",
    description: "Fewer than 2 appointments recorded — cannot yet be scored.",
    Icon: HelpCircle,
    cardClass: "bg-slate-900/40 backdrop-blur-md shadow-[0_0_30px_rgba(148,163,184,0.15)]",
    iconClass: "text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]",
    countClass: "text-slate-300 drop-shadow-[0_0_12px_rgba(148,163,184,0.4)]",
    borderClass: "border-slate-500/50",
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
            customClass={`${t.cardClass} border ${t.borderClass} p-6 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-sm font-bold uppercase tracking-widest mb-1 ${t.iconClass}`}>
                  {t.label}
                </div>
                <p className="text-white/80 text-sm leading-relaxed max-w-[220px]">
                  {t.description}
                </p>
              </div>
              <t.Icon size={34} className={`${t.iconClass} shrink-0 ml-2 mt-0.5`} />
            </div>

            <div className="flex items-end justify-between mt-4">
              <div>
                <div className={`text-5xl font-black tabular-nums tracking-tighter ${t.countClass}`}>
                  {stats ? t.getCount(stats) : "—"}
                </div>
                <div className="text-white/50 text-xs mt-1 uppercase tracking-wider font-semibold">patients</div>
              </div>
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${t.borderClass} ${t.iconClass} bg-white/5 backdrop-blur-sm`}>
                Click to filter →
              </div>
            </div>
          </Card>
        ))}
      </CardSwap>
    </div>
  );
}
