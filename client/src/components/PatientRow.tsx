import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ArrowRight, AlertCircle, ExternalLink, FileDown } from "lucide-react";
import { PatientWithRisk } from "../types";
import FactorBar from "./FactorBar";
import { downloadPatientPDF } from "../utils/pdfGenerator";

function tierBadgeClass(tier: PatientWithRisk["risk"]["tier"]): string {
  switch (tier) {
    case "High":
      return "tier-badge tier-badge-high";
    case "Medium":
      return "tier-badge tier-badge-medium";
    case "Low":
      return "tier-badge tier-badge-low";
    default:
      return "tier-badge tier-badge-unknown";
  }
}

/** Returns a Tailwind box-shadow colour token matching the tier. */
function tierGlowStyle(tier: PatientWithRisk["risk"]["tier"]): React.CSSProperties {
  const colors: Record<string, string> = {
    High: "rgba(220, 38, 38, 0.18)",
    Medium: "rgba(217, 119, 6, 0.18)",
    Low: "rgba(13, 148, 136, 0.18)",
    "Insufficient history": "rgba(107, 114, 128, 0.12)",
  };
  return { "--glow": colors[tier] ?? "transparent" } as React.CSSProperties;
}

interface Props {
  patient: PatientWithRisk;
  onViewProfile: () => void;
}

export default function PatientRow({ patient, onViewProfile }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { risk } = patient;
  const isColdStart = risk.tier === "Insufficient history";

  return (
    <motion.div
      className="border border-white/10 rounded-xl bg-white/5 overflow-hidden backdrop-blur-sm"
      style={tierGlowStyle(risk.tier)}
      whileHover={{
        boxShadow: "0 0 0 2px var(--glow), 0 4px 16px var(--glow)",
        scale: 1.005,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-white/10 transition-colors"
      >
        <div className="w-16 shrink-0 font-mono text-xs text-white/40">{patient.id}</div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{patient.name}</div>
          <div className="text-xs text-white/60 truncate">
            {risk.topReasonLabel ?? "No elevated risk factors"}
          </div>
        </div>

        <div className="hidden md:block text-sm text-white/60 w-14 text-right">
          {patient.age} yrs
        </div>
        <div className="hidden md:block text-sm text-white/60 w-20 text-right">
          {patient.distanceKm} km
        </div>
        <div className="hidden md:block text-sm text-white/60 w-28 text-right">
          {patient.daysSinceLastVisit}d overdue*
        </div>

        <span className={tierBadgeClass(risk.tier)}>{risk.tier}</span>

        <div className="w-14 text-right font-bold text-white">
          {risk.score === null ? "—" : `${risk.score}/100`}
        </div>

        {/* Spring-animated chevron — replaces CSS class rotation */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="text-white/40"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="border-t border-white/10"
          >
            <div className="px-4 py-4">
              {isColdStart ? (
                <div className="flex items-start gap-3 rounded-lg bg-white/5 border border-white/10 p-4">
                  <AlertCircle className="text-white/40 mt-0.5" size={20} />
                  <div>
                    <div className="font-medium text-white/90">
                      Insufficient appointment history
                    </div>
                    <p className="text-sm text-white/60 mt-1">
                      {risk.reasons[0].label}. This patient is excluded from tier ranking
                      until at least 2 appointments are recorded.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-brand-dark">
                      <ArrowRight size={15} />
                      {risk.suggestedActions[0]}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-1">
                    Factor breakdown
                  </div>
                  <div className="divide-y divide-white/10">
                    {risk.reasons.map((r) => (
                      <FactorBar key={r.key} reason={r} />
                    ))}
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-wide text-white/40 mt-4 mb-2">
                    Suggested next actions
                  </div>
                  <ul className="space-y-1.5">
                    {risk.suggestedActions.map((action) => (
                      <li
                        key={action}
                        className="flex items-center gap-2 text-sm text-white/80"
                      >
                        <ArrowRight size={15} className="text-brand-dark shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Actions row in expanded state */}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPatientPDF(patient);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand border border-brand/30 hover:border-brand bg-brand/10 hover:bg-brand/20 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <FileDown size={13} />
                  Download PDF
                </button>
                <button
                  id={`view-profile-${patient.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProfile();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-brand-light border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <ExternalLink size={13} />
                  View full profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
