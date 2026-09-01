import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, Loader2, Eye, History, Info } from "lucide-react";
import Header from "../components/Header";
import { AtRiskEmailCandidate, BulkEmailResult, SentEmailRecord } from "../types";

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "High"
      ? "tier-badge tier-badge-high"
      : tier === "Medium"
      ? "tier-badge tier-badge-medium"
      : "tier-badge tier-badge-unknown";
  return <span className={cls}>{tier}</span>;
}

export default function EmailsPage() {
  const [candidates, setCandidates] = useState<AtRiskEmailCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; body: string; toAddress: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<BulkEmailResult | null>(null);
  const [history, setHistory] = useState<SentEmailRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/emails/at-risk");
      const data: AtRiskEmailCandidate[] = await res.json();
      setCandidates(data);
      // Default-select everyone who has an email on file
      setSelected(new Set(data.filter((c) => c.email).map((c) => c.id)));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/emails/history");
    setHistory(await res.json());
  }, []);

  useEffect(() => {
    loadCandidates();
    loadHistory();
  }, [loadCandidates, loadHistory]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPreview = useCallback(async (id: string) => {
    setPreviewId(id);
    setPreview(null);
    const res = await fetch(`/api/emails/preview?patientId=${encodeURIComponent(id)}`);
    if (res.ok) setPreview(await res.json());
  }, []);

  const sendBulk = useCallback(async () => {
    if (selected.size === 0) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/emails/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientIds: Array.from(selected) }),
      });
      const result: BulkEmailResult = await res.json();
      setSendResult(result);
      loadHistory();
    } finally {
      setSending(false);
    }
  }, [selected, loadHistory]);

  const selectableCount = useMemo(() => candidates.filter((c) => c.email).length, [candidates]);

  return (
    <div className="min-h-screen w-full text-white">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Bulk Email — Patients Needing Attention</h1>
            <p className="text-white/60 text-sm mt-1 max-w-2xl">
              High and Medium risk patients with an email on file. Each email is composed from
              the patient's own risk reasons — nothing generic. No SMTP credentials are
              configured in this environment, so sends are logged as{" "}
              <span className="text-white/80 font-medium">simulated</span> rather than actually
              delivered; wire real credentials via SMTP_HOST/SMTP_USER/SMTP_PASS to go live.
            </p>
          </div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-white/85 transition-colors shrink-0"
          >
            <History size={15} />
            {showHistory ? "Hide" : "Show"} history ({history.length})
          </button>
        </div>

        {showHistory && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 max-h-72 overflow-y-auto">
            {history.length === 0 && <p className="text-white/50 text-sm">No emails sent yet.</p>}
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-lg bg-white/5">
                <div className="min-w-0">
                  <div className="text-white truncate">{h.patientName} — {h.subject}</div>
                  <div className="text-white/40 text-xs">{new Date(h.sentAt).toLocaleString()} → {h.toAddress ?? "no email on file"}</div>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${
                    h.status === "sent"
                      ? "text-emerald-400"
                      : h.status === "simulated"
                      ? "text-brand"
                      : h.status === "skipped_no_email"
                      ? "text-white/40"
                      : "text-red-400"
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-white/50 text-sm py-10 text-center">Loading at-risk patients…</p>
        ) : candidates.length === 0 ? (
          <p className="text-white/50 text-sm py-10 text-center">No High or Medium risk patients right now.</p>
        ) : (
          <div className="grid md:grid-cols-[1fr_360px] gap-6">
            {/* Patient picker */}
            <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    disabled={!c.email}
                    onChange={() => toggle(c.id)}
                    className="accent-brand w-4 h-4 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{c.name}</span>
                      <TierBadge tier={c.tier} />
                    </div>
                    <div className="text-xs text-white/50 truncate">
                      {c.email ?? "No email on file — will be skipped"}
                    </div>
                  </div>
                  <span className="font-bold text-white w-8 text-right shrink-0">{c.score ?? "—"}</span>
                  <button
                    onClick={() => openPreview(c.id)}
                    className="text-white/50 hover:text-brand transition-colors shrink-0"
                    aria-label={`Preview email for ${c.name}`}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Send panel */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-brand/30 bg-white/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Mail size={18} className="text-brand" />
                  Send bulk email
                </div>
                <p className="text-sm text-white/60">
                  {selected.size} of {selectableCount} eligible patient{selectableCount !== 1 ? "s" : ""} selected.
                </p>
                <button
                  onClick={sendBulk}
                  disabled={selected.size === 0 || sending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-dark hover:bg-brand-mid disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send to {selected.size} patient{selected.size !== 1 ? "s" : ""}
                </button>

                <AnimatePresence>
                  {sendResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-white/80 space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Info size={12} />
                        Transport: {sendResult.transport === "smtp" ? "Live SMTP" : "Simulated (no SMTP configured)"}
                      </div>
                      <div>Requested: {sendResult.requested}</div>
                      {sendResult.sent > 0 && <div className="text-emerald-400">Sent: {sendResult.sent}</div>}
                      {sendResult.simulated > 0 && <div className="text-brand">Simulated: {sendResult.simulated}</div>}
                      {sendResult.skippedNoEmail > 0 && (
                        <div className="text-white/50">Skipped (no email): {sendResult.skippedNoEmail}</div>
                      )}
                      {sendResult.failed > 0 && <div className="text-red-400">Failed: {sendResult.failed}</div>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Preview */}
              {previewId && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Eye size={14} className="text-brand" />
                    Preview
                  </div>
                  {!preview ? (
                    <p className="text-white/40 text-xs">Loading…</p>
                  ) : (
                    <div className="text-xs space-y-2">
                      <p className="text-white/50">To: {preview.toAddress ?? "—"}</p>
                      <p className="text-white font-medium">{preview.subject}</p>
                      <pre className="whitespace-pre-wrap text-white/70 font-sans leading-relaxed">
                        {preview.body}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
