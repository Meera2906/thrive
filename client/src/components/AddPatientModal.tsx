import { useState, useRef } from "react";
import { X, UserPlus, ScanLine, FileText, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { PatientWithRisk } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (newPatient: PatientWithRisk) => void;
}

export default function AddPatientModal({ isOpen, onClose, onPatientAdded }: Props) {
  const [activeTab, setActiveTab] = useState<"manual" | "ocr">("manual");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">(45);
  const [distanceKm, setDistanceKm] = useState<number | "">(12);
  const [totalAppointments, setTotalAppointments] = useState<number | "">(6);
  const [missedAppointments, setMissedAppointments] = useState<number | "">(3);
  const [daysSinceLastVisit, setDaysSinceLastVisit] = useState<number | "">(65);
  const [expectedFrequencyDays, setExpectedFrequencyDays] = useState<number | "">(30);
  const [treatmentElapsedDays, setTreatmentElapsedDays] = useState<number | "">(45);
  const [treatmentTotalDays, setTreatmentTotalDays] = useState<number | "">(180);

  // OCR scanning state
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide patient name");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        id: id.trim() || undefined,
        name: name.trim(),
        email: email.trim() || undefined,
        age: Number(age) || 45,
        distanceKm: Number(distanceKm) || 0,
        totalAppointmentCount: Number(totalAppointments) || 1,
        missedAppointmentCount: Number(missedAppointments) || 0,
        daysSinceLastVisit: Number(daysSinceLastVisit) || 0,
        expectedFrequencyDays: Number(expectedFrequencyDays) || 30,
        treatmentElapsedDays: Number(treatmentElapsedDays) || 30,
        treatmentTotalDays: Number(treatmentTotalDays) || 180,
      };

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to save patient");
      }

      const created: PatientWithRisk = await res.json();
      onPatientAdded(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOcrFile = (file: File) => {
    setScanning(true);
    setScanSuccess(false);
    setError(null);

    // Simulate smart OCR optical scan parsing of prescription / intake sheet
    setTimeout(() => {
      // Mock extracted values derived from document scan
      const fileNameLower = file.name.toLowerCase();
      let mockName = "Evelyn Vance";
      if (fileNameLower.includes("smith")) mockName = "Sarah Smith";
      else if (fileNameLower.includes("john")) mockName = "John Miller";

      setName(mockName);
      setId(`SCAN-${Math.floor(1000 + Math.random() * 9000)}`);
      setAge(58);
      setEmail(`${mockName.toLowerCase().replace(" ", ".")}@example.org`);
      setDistanceKm(18.5);
      setTotalAppointments(8);
      setMissedAppointments(4);
      setDaysSinceLastVisit(72);
      setExpectedFrequencyDays(30);
      setTreatmentElapsedDays(90);
      setTreatmentTotalDays(180);

      setScanning(false);
      setScanSuccess(true);
      setActiveTab("manual"); // Switch to form tab so user can review extracted fields
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Patient Entry</h2>
              <p className="text-xs text-slate-400">Manual entry or OCR prescription scan extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "manual"
                ? "bg-brand text-slate-950 shadow-lg shadow-brand/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={16} />
            Manual Patient Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ocr")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "ocr"
                ? "bg-brand text-slate-950 shadow-lg shadow-brand/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ScanLine size={16} />
            Scan Medical Document (OCR)
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {scanSuccess && activeTab === "manual" && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            Document scanned successfully! Extracted fields auto-filled below for review.
          </div>
        )}

        {/* Tab 1: Manual Form */}
        {activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Patient ID (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="sarah@example.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Age (Years)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Distance to Clinic (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Days Since Last Visit</label>
                <input
                  type="number"
                  min={0}
                  value={daysSinceLastVisit}
                  onChange={(e) => setDaysSinceLastVisit(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Appointments</label>
                <input
                  type="number"
                  min={0}
                  value={totalAppointments}
                  onChange={(e) => setTotalAppointments(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Missed Appointments</label>
                <input
                  type="number"
                  min={0}
                  value={missedAppointments}
                  onChange={(e) => setMissedAppointments(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-mid text-slate-950 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand/20"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Calculate Score & Save
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: OCR Document Scanner */}
        {activeTab === "ocr" && (
          <div className="space-y-6 text-center py-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-brand/40 bg-brand/5 hover:bg-brand/10 hover:border-brand rounded-3xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleOcrFile(f);
                }}
              />

              {scanning ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={40} className="animate-spin text-brand" />
                  <p className="text-white font-bold text-base">Extracting clinical metrics with OCR…</p>
                  <p className="text-slate-400 text-xs">Reading prescription/intake data scan</p>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-brand/10 text-brand border border-brand/30">
                    <ScanLine size={36} />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Drop scanned prescription or intake document</p>
                    <p className="text-slate-400 text-xs mt-1">Supports PNG, JPG, scanned PDFs or medical report images</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-brand border border-brand/20">
                    <Sparkles size={14} />
                    Auto-populates 6 scoring factor parameters
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
