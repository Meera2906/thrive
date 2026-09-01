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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Patient profile: ${patient.name}`}
    >
      {/* Inner card — stop propagation so clicks inside don't close */}
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-900">{patient.name}</div>
            <div className="text-xs text-slate-400 font-mono">{patient.id}</div>
          </div>
          <button
            id={`modal-close-${patient.id}`}
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            aria-label="Close patient profile"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-lg font-bold text-slate-900">
                {risk.score === null ? "—" : risk.score}
              </div>
              <div className="text-xs text-slate-500">Score</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-lg font-bold text-slate-900">{patient.age}</div>
              <div className="text-xs text-slate-500">Age</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-lg font-bold text-slate-900">{patient.distanceKm} km</div>
              <div className="text-xs text-slate-500">Distance</div>
            </div>
          </div>

          {/* Extra stats row */}
          <div className="grid grid-cols-2 gap-3 text-center mb-4">
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-base font-bold text-slate-900">
                {patient.missedAppointmentCount}/{patient.totalAppointmentCount}
              </div>
              <div className="text-xs text-slate-500">Appointments missed</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-base font-bold text-slate-900">
                {patient.daysSinceLastVisit}d
              </div>
              <div className="text-xs text-slate-500">Since last visit</div>
            </div>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
            Factor breakdown
          </div>
          <div className="divide-y divide-slate-50">
            {risk.reasons.map((r) => (
              <FactorBar key={r.key} reason={r} />
            ))}
          </div>

          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-4 mb-2">
            Suggested next actions
          </div>
          <ul className="space-y-1.5">
            {risk.suggestedActions.map((action) => (
              <li key={action} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-teal-600 mt-0.5">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
