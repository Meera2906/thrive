import { motion } from "framer-motion";
import { PatientWithRisk } from "../types";
import { Phone, Mail, FileDown, Eye, AlertTriangle, ShieldCheck, Clock, Navigation } from "lucide-react";
import { downloadPatientPDF } from "../utils/pdfGenerator";

interface Props {
  patients: PatientWithRisk[];
  onViewProfile: (patient: PatientWithRisk) => void;
}

export default function DashboardAnalyticsVisuals({ patients, onViewProfile }: Props) {
  const highRiskCount = patients.filter((p) => p.risk.tier === "High").length;
  const mediumRiskCount = patients.filter((p) => p.risk.tier === "Medium").length;
  const lowRiskCount = patients.filter((p) => p.risk.tier === "Low").length;
  const coldCount = patients.filter((p) => p.risk.tier === "Insufficient history").length;
  const totalCount = patients.length || 1;

  const highPct = Math.round((highRiskCount / totalCount) * 100);
  const medPct = Math.round((mediumRiskCount / totalCount) * 100);
  const lowPct = Math.round((lowRiskCount / totalCount) * 100);
  const coldPct = Math.round((coldCount / totalCount) * 100);

  // Factor weight aggregates across current patient set
  const factorImpacts = [
    { name: "Missed Appt Ratio", maxPts: 35, color: "bg-red-500", key: "missedRatio" },
    { name: "Days Overdue", maxPts: 20, color: "bg-amber-500", key: "daysOverdue" },
    { name: "Clinic Distance", maxPts: 15, color: "bg-indigo-500", key: "distance" },
    { name: "Treatment Fatigue", maxPts: 15, color: "bg-rose-500", key: "fatigue" },
    { name: "Patient Age", maxPts: 10, color: "bg-blue-500", key: "age" },
    { name: "Appt Frequency", maxPts: 5, color: "bg-teal-500", key: "frequency" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Top Row: Animated Visual Analytics Summary ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut / Progress Bar Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                Risk Tier Distribution
              </h3>
              <span className="text-xs text-slate-400 font-medium">{patients.length} total patients</span>
            </div>

            {/* Segmented Stacked Progress Bar */}
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800 mb-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${highPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-l-full"
                title={`High: ${highPct}%`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${medPct}%` }}
                transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                className="bg-gradient-to-r from-amber-600 to-amber-400 h-full"
                title={`Medium: ${medPct}%`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lowPct}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="bg-gradient-to-r from-teal-600 to-teal-400 h-full"
                title={`Low: ${lowPct}%`}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${coldPct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="bg-slate-600 h-full rounded-r-full"
                title={`Insufficient history: ${coldPct}%`}
              />
            </div>

            {/* Detailed Tier Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-slate-300">High Risk</span>
                </div>
                <span className="text-sm font-extrabold text-white">{highRiskCount} ({highPct}%)</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-slate-300">Medium</span>
                </div>
                <span className="text-sm font-extrabold text-white">{mediumRiskCount} ({medPct}%)</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-xs font-semibold text-slate-300">Low Risk</span>
                </div>
                <span className="text-sm font-extrabold text-white">{lowRiskCount} ({lowPct}%)</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <span className="text-xs font-semibold text-slate-300">Cold Start</span>
                </div>
                <span className="text-sm font-extrabold text-white">{coldCount} ({coldPct}%)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 6 Scoring Factors Impact Weight Bars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand" />
              6-Factor Weight Max Allocation
            </h3>
            <span className="text-xs text-brand font-semibold">100 Max Risk Score Cap</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {factorImpacts.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{f.name}</span>
                  <span className="text-xs font-extrabold text-brand">+{f.maxPts} pts</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${(f.maxPts / 35) * 100}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Visual Patient Risk Cards Grid ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold text-white">Visual Risk Patient Cards</h3>
          <span className="text-xs text-slate-400 font-medium">Showing {patients.length} patients</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((patient, idx) => {
            const { risk } = patient;
            const isHigh = risk.tier === "High";
            const isMed = risk.tier === "Medium";
            const isLow = risk.tier === "Low";

            const tierBadgeBg = isHigh
              ? "bg-red-500/10 text-red-400 border-red-500/30"
              : isMed
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : isLow
              ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700";

            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(0.05 * idx, 0.4) }}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-600 rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{patient.name}</h4>
                      <span className="text-xs text-slate-500 font-mono">{patient.id}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${tierBadgeBg}`}>
                      {risk.tier}
                    </span>
                  </div>

                  {/* Score & Key Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center mb-4">
                    <div>
                      <div className="text-base font-extrabold text-white">
                        {risk.score === null ? "—" : `${risk.score}`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Risk Score</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-white">
                        {patient.missedAppointmentCount}/{patient.totalAppointmentCount}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Missed Appts</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-white flex items-center justify-center gap-0.5">
                        <Clock size={12} className="text-slate-400" />
                        {patient.daysSinceLastVisit}d
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Days Overdue</div>
                    </div>
                  </div>

                  {/* Top 2 Contributing Factor Reasons */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Primary Risk Drivers
                    </div>
                    {risk.reasons.slice(0, 2).map((reason) => (
                      <div
                        key={reason.key}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/80"
                      >
                        <span className="text-slate-300 font-medium truncate max-w-[170px]">
                          {reason.label}
                        </span>
                        <span className="font-extrabold text-brand shrink-0">+{reason.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewProfile(patient)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="View Full Profile"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => downloadPatientPDF(patient)}
                      className="p-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 transition-colors"
                      title="Download Patient PDF"
                    >
                      <FileDown size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:+15550000000`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <Phone size={13} />
                      Call
                    </a>
                    {patient.email && (
                      <a
                        href={`mailto:${patient.email}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <Mail size={13} />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
