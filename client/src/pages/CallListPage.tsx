import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, ChevronDown, MessageSquareText, CheckCircle2, Loader2 } from "lucide-react";
import Header from "../components/Header";
import { CALL_OUTCOMES, CallOutcome, CallQueueItem } from "../types";

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "High"
      ? "tier-badge tier-badge-high"
      : tier === "Medium"
      ? "tier-badge tier-badge-medium"
      : "tier-badge tier-badge-unknown";
  return <span className={cls}>{tier}</span>;
}

function CallCard({ item, onLogged }: { item: CallQueueItem; onLogged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [logging, setLogging] = useState<CallOutcome | null>(null);
  const [notes, setNotes] = useState("");

  const submitOutcome = useCallback(
    async (outcome: CallOutcome) => {
      setLogging(outcome);
      try {
        await fetch("/api/call-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: item.patientId, outcome, notes: notes.trim() || null }),
        });
        onLogged();
      } finally {
        setLogging(null);
      }
    },
    [item.patientId, notes, onLogged]
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <PhoneCall size={16} className="text-brand shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-white truncate">{item.patientName}</div>
            <div className="text-xs text-white/50 truncate">{item.topReasonLabel ?? "—"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {item.lastCall && (
            <span className="text-xs text-white/40 hidden sm:inline">
              Last: {item.lastCall.outcome}
            </span>
          )}
          <TierBadge tier={item.tier} />
          <span className="font-bold text-white w-8 text-right">{item.score ?? "—"}</span>
          <ChevronDown
            size={16}
            className={`text-white/50 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/10">
              {/* Script */}
              <div className="flex items-start gap-2 mt-3">
                <MessageSquareText size={15} className="text-brand mt-0.5 shrink-0" />
                <div className="text-sm space-y-2 text-white/85">
                  <p className="italic">&ldquo;{item.script.opening}&rdquo;</p>

                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                      Why they're flagged
                    </p>
                    <ul className="space-y-1">
                      {item.script.reasonLines.map((line, i) => (
                        <li key={i} className="text-white/80">
                          • {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                      Talking points
                    </p>
                    <ul className="space-y-1">
                      {item.script.talkingPoints.map((line, i) => (
                        <li key={i} className="text-white/80">
                          • {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="italic">&ldquo;{item.script.closing}&rdquo;</p>
                </div>
              </div>

              {/* Outcome logging */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes…"
                  className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand"
                />
                <div className="flex flex-wrap gap-2">
                  {CALL_OUTCOMES.map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => submitOutcome(outcome)}
                      disabled={logging !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-brand-dark text-xs font-medium text-white/85 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {logging === outcome ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CallListPage() {
  const [items, setItems] = useState<CallQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/call-list");
      if (!res.ok) throw new Error("Failed to load call list");
      setItems(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load call list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen w-full text-white">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Patients to Call</h1>
          <p className="text-white/60 text-sm mt-1">
            High and Medium risk patients, ranked by score. Each card has a ready-to-read script
            built from the same reasons shown on the dashboard — expand a card, talk through it,
            and log the outcome.
          </p>
        </div>

        {loading && <p className="text-white/50 text-sm py-10 text-center">Loading call queue…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="text-white/50 text-sm py-10 text-center">
            No High or Medium risk patients right now — nobody needs a call.
          </p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <CallCard key={item.patientId} item={item} onLogged={load} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
