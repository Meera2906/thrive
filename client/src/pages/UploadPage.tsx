import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  FileText,
  Trash2,
} from "lucide-react";
import Header from "../components/Header";
import { UploadRecord } from "../types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TierPill({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
      <span className="text-xs text-white/60">{label}</span>
      <span className={`text-sm font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<UploadRecord | null>(null);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/uploads");
      if (!res.ok) throw new Error("Failed to load upload history");
      setHistory(await res.json());
    } catch {
      // Non-fatal — history panel just stays empty
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setLatestResult(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Upload failed (${res.status})`);
        }
        const record: UploadRecord = await res.json();
        setLatestResult(record);
        loadHistory();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [loadHistory]
  );

  const handleDelete = useCallback(
    async (id: string, filename: string) => {
      if (!window.confirm(`Remove "${filename}" from upload history?`)) return;
      setDeletingId(id);
      try {
        const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setHistory((prev) => prev.filter((h) => h.id !== id));
      } catch {
        alert("Could not delete this upload. Please try again.");
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen w-full text-white">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Data Upload</h1>
          <p className="text-white/60 text-sm mt-1">
            Upload a hospital patient-history export (CSV) to get an instant risk analytics
            snapshot. The file itself is kept on record — every upload can be traced back to the
            exact bytes that produced it.
          </p>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-brand bg-brand/10"
              : "border-white/20 bg-white/5 hover:border-brand/60 hover:bg-white/[0.07]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFileInput}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-brand" size={32} />
              <p className="text-white/80">Parsing and scoring patients…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="text-brand" size={32} />
              <p className="text-white font-medium">Drag & drop a CSV here, or click to browse</p>
              <p className="text-white/50 text-sm">
                Columns: id, name, email, age, distanceKm, totalAppointmentCount,
                missedAppointmentCount, daysSinceLastVisit, expectedFrequencyDays,
                treatmentElapsedDays, treatmentTotalDays
              </p>
              <a
                href="/sample-patients.csv"
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-mid underline underline-offset-2"
              >
                <Download size={14} />
                Download a sample CSV template
              </a>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            <FileWarning size={18} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Instant analytics */}
        <AnimatePresence>
          {latestResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-brand/30 bg-white/5 p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <h2 className="font-semibold text-lg">
                  Instant analytics — {latestResult.filename}
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TierPill label="Rows read" value={latestResult.analytics.rowCount} colorClass="text-white" />
                <TierPill label="Valid patients" value={latestResult.analytics.validCount} colorClass="text-emerald-400" />
                <TierPill label="New patients" value={latestResult.analytics.newPatientCount} colorClass="text-brand" />
                <TierPill label="Updated patients" value={latestResult.analytics.updatedPatientCount} colorClass="text-white/80" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TierPill label="High risk" value={latestResult.analytics.tierCounts.high} colorClass="text-red-400" />
                <TierPill label="Medium risk" value={latestResult.analytics.tierCounts.medium} colorClass="text-amber-400" />
                <TierPill label="Low risk" value={latestResult.analytics.tierCounts.low} colorClass="text-teal-400" />
                <TierPill
                  label="Insufficient history"
                  value={latestResult.analytics.tierCounts.insufficientHistory}
                  colorClass="text-white/60"
                />
              </div>

              {latestResult.analytics.averageScore !== null && (
                <p className="text-sm text-white/70">
                  Average risk score across this batch:{" "}
                  <span className="font-semibold text-white">{latestResult.analytics.averageScore}</span> / 100
                </p>
              )}

              {latestResult.analytics.topRiskPatientIds.length > 0 && (
                <p className="text-sm text-white/70">
                  Highest-risk patient IDs in this batch:{" "}
                  <span className="font-mono text-white">
                    {latestResult.analytics.topRiskPatientIds.join(", ")}
                  </span>
                </p>
              )}

              {latestResult.errors.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-amber-300 text-sm font-medium">
                    <AlertTriangle size={15} />
                    {latestResult.errors.length} row issue{latestResult.errors.length !== 1 ? "s" : ""}
                  </div>
                  <ul className="text-xs text-amber-200/80 space-y-0.5 max-h-32 overflow-y-auto">
                    {latestResult.errors.map((e, i) => (
                      <li key={i}>
                        {e.row > 0 ? `Row ${e.row}: ` : ""}
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload history */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold text-lg mb-4">Upload history</h2>
          {historyLoading ? (
            <p className="text-white/50 text-sm">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-white/50 text-sm">No uploads yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-white/40 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">{h.filename}</div>
                      <div className="text-white/50 text-xs">
                        {new Date(h.uploadedAt).toLocaleString()} · {formatBytes(h.sizeBytes)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-red-400">{h.analytics.tierCounts.high} High</span>
                    <span className="text-amber-400">{h.analytics.tierCounts.medium} Med</span>
                    <span className="text-teal-400">{h.analytics.tierCounts.low} Low</span>
                    <a
                      href={`/api/uploads/${h.id}/file`}
                      className="text-brand hover:text-brand-mid inline-flex items-center gap-1"
                    >
                      <Download size={13} /> File
                    </a>
                    <button
                      onClick={() => handleDelete(h.id, h.filename)}
                      disabled={deletingId === h.id}
                      className="text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
                      title="Remove from history"
                    >
                      {deletingId === h.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
