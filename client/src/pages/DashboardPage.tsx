import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import SummaryCards from "../components/SummaryCards";
import PatientFilters from "../components/PatientFilters";
import PatientList from "../components/PatientList";
import PatientDetailModal from "../components/PatientDetailModal";
import HospitalLoader from "../components/showcase/HospitalLoader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { PatientWithRisk, SortKey, StatsResponse, TierFilter } from "../types";

const VALID_TIERS: TierFilter[] = ["High", "Medium", "Low", "Insufficient history"];

export default function DashboardPage() {
  const [searchParams] = useSearchParams();

  // Read ?tier= from URL on mount; fall back to "All" if absent / invalid
  const initialTier = (): TierFilter => {
    const raw = searchParams.get("tier") as TierFilter | null;
    return raw && VALID_TIERS.includes(raw) ? raw : "All";
  };

  const [patients, setPatients] = useState<PatientWithRisk[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRisk | null>(null);

  // Filter / sort state — tier initialised from URL param
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>(initialTier);
  const [sortKey, setSortKey] = useState<SortKey>("score");

  // Load data — re-runs when retryCount changes (manual retry)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [patientsRes, statsRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/stats"),
        ]);
        if (!patientsRes.ok || !statsRes.ok) throw new Error("API request failed");
        const patientsData: PatientWithRisk[] = await patientsRes.json();
        const statsData: StatsResponse = await statsRes.json();
        if (!cancelled) {
          setPatients(patientsData);
          setStats(statsData);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not reach the API. Make sure the server is running on port 5000."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedPatient) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedPatient(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPatient]);

  const handleViewProfile = useCallback((patient: PatientWithRisk) => {
    setSelectedPatient(patient);
  }, []);

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setTier("All");
  }, []);

  const visiblePatients = useMemo(() => {
    let result = patients;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    if (tier !== "All") {
      result = result.filter((p) => p.risk.tier === tier);
    }

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "overdue":
          return b.daysSinceLastVisit - a.daysSinceLastVisit;
        case "distance":
          return b.distanceKm - a.distanceKm;
        case "score":
        default: {
          const aCold = a.risk.tier === "Insufficient history";
          const bCold = b.risk.tier === "Insufficient history";
          if (aCold && !bCold) return 1;
          if (!aCold && bCold) return -1;
          return (b.risk.score ?? 0) - (a.risk.score ?? 0);
        }
      }
    });

    return result;
  }, [patients, query, tier, sortKey]);

  const hasActiveFilters = query.trim() !== "" || tier !== "All";

  return (
    <div className="min-h-screen w-full text-white">
      {/* Modal overlay — rendered at top level to cover everything */}
      <PatientDetailModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <SummaryCards stats={stats} />

        <PatientFilters
          query={query}
          onQueryChange={setQuery}
          tier={tier}
          onTierChange={setTier}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
        />

        {loading && (
          <div className="py-20">
            <HospitalLoader />
          </div>
        )}

        {error && !loading && (
          <ErrorState error={error} onRetry={() => setRetryCount((c) => c + 1)} />
        )}

        {!loading && !error && visiblePatients.length > 0 && (
          <PatientList patients={visiblePatients} onViewProfile={handleViewProfile} />
        )}

        {!loading && !error && visiblePatients.length === 0 && (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        )}
      </main>
    </div>
  );
}
