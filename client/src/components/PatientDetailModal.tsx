import { X } from "lucide-react";
import { PatientWithRisk } from "../types";
import FactorBar from "./FactorBar";

interface Props {
  patient: PatientWithRisk | null;
  onClose: () => void;
}

/**
 * Deep-dive view for a single patient. Triggered via "View full profile"
 * in PatientRow's expanded state. Closes on backdrop click or Escape key
 * (Escape handled in App.tsx).
 */
export default function PatientDetailModal({ patient, onClose }: Props) {
  if (!patient) return null;
  const { risk } = patient;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#090A0F]/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Patient profile: ${patient.name}`}
    >
      {/* Inner card — stop propagation so clicks inside don't close */}
      <div
        className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <div className="font-bold text-white">{patient.name}</div>
            <div className="text-xs text-white/40 font-mono">{patient.id}</div>
          </div>
          <button
            id={`modal-close-${patient.id}`}
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/40"
            aria-label="Close patient profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-lg font-bold text-white">
                {risk.score === null ? "—" : risk.score}
              </div>
              <div className="text-xs text-white/60">Score</div>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-lg font-bold text-white">{patient.age}</div>
              <div className="text-xs text-white/60">Age</div>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-lg font-bold text-white">{patient.distanceKm} km</div>
              <div className="text-xs text-white/60">Distance</div>
            </div>
          </div>

          {/* Extra stats row */}
          <div className="grid grid-cols-2 gap-3 text-center mb-4">
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-base font-bold text-white">
                {patient.missedAppointmentCount}/{patient.totalAppointmentCount}
              </div>
              <div className="text-xs text-white/60">Appointments missed</div>
            </div>
            <div className="rounded-lg bg-white/5 py-2">
              <div className="text-base font-bold text-white">
                {patient.daysSinceLastVisit}d
              </div>
              <div className="text-xs text-white/60">Since last visit</div>
            </div>
          </div>

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
              <li key={action} className="flex items-start gap-2 text-sm text-white/80">
                <span className="text-brand-dark mt-0.5">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
