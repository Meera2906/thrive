import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, FileDown, BarChart3, LayoutGrid } from "lucide-react";
import Header from "../components/Header";
import SummaryCards from "../components/SummaryCards";
import PatientFilters from "../components/PatientFilters";
import PatientList from "../components/PatientList";
import PatientDetailModal from "../components/PatientDetailModal";
import AddPatientModal from "../components/AddPatientModal";
import DashboardAnalyticsVisuals from "../components/DashboardAnalyticsVisuals";
import HospitalLoader from "../components/showcase/HospitalLoader";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import { PatientWithRisk, SortKey, StatsResponse, TierFilter } from "../types";
import { downloadBulkPatientsPDF } from "../utils/pdfGenerator";

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

  // View & Modal states
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRisk | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter / sort state — tier initialised from URL param
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>(initialTier);
  const [sortKey, setSortKey] = useState<SortKey>("score");

  // Load data — re-runs when retryCount changes (manual retry)
  const fetchDashboardData = useCallback(async () => {
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
      setPatients(patientsData);
      setStats(statsData);
    } catch {
      setError("Could not reach the API. Make sure the server is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [retryCount, fetchDashboardData]);

  // Close modal on Escape key
  useEffect(() => {
    if (!selectedPatient && !isAddModalOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedPatient(null);
        setIsAddModalOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedPatient, isAddModalOpen]);

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
    <div className="min-h-screen w-full text-white bg-slate-950 pb-16">
      {/* Patient Profile Detail Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      {/* Add / Scan Patient Modal */}
      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={() => fetchDashboardData()}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <SummaryCards stats={stats} />

        {/* Global Action Toolbar & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-md">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
            <button
              onClick={() => setViewMode("visual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "visual"
                  ? "bg-brand text-slate-950 shadow-md shadow-brand/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 size={15} />
              Visual Analytics & Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-brand text-slate-950 shadow-md shadow-brand/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={15} />
              Data Table View
            </button>
          </div>

          {/* Actions: Add Patient & Bulk PDF Download */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand hover:bg-brand-mid text-slate-950 font-bold text-xs transition-all shadow-lg shadow-brand/20"
            >
              <UserPlus size={16} />
              Add / Scan Patient
            </button>

            <button
              onClick={() => downloadBulkPatientsPDF(visiblePatients, "Filtered Patient Risk Report")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all"
              title="Download PDF report for all current patients"
            >
              <FileDown size={16} className="text-brand" />
              Download Bulk PDF
            </button>
          </div>
        </div>

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
          <>
            {viewMode === "visual" ? (
              <DashboardAnalyticsVisuals
                patients={visiblePatients}
                onViewProfile={handleViewProfile}
              />
            ) : (
              <PatientList patients={visiblePatients} onViewProfile={handleViewProfile} />
            )}
          </>
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
