import { Link, useLocation } from "react-router-dom";
import { HeartPulse, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function Header() {
  const location = useLocation();
  const isOnDashboard = location.pathname === "/dashboard";

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
        {/* Logo — clicking goes to "/" always */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="Thrive home">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors bg-brand group-hover:bg-brand/80">
            <HeartPulse className="text-white" size={22} />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-white">
              Patient Follow-up Risk Predictor
            </div>
            <p className="text-sm leading-tight text-white/60">
              Transparent, rule-based follow-up drop-out risk ranking
            </p>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Nav — one conditional block ─────────────────────────────── */}
        {isOnDashboard ? (
          /* On /dashboard: show "← Back to Home" */
          <Link
            to="/"
            id="back-to-home-nav"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-brand text-brand-dark bg-brand-muted hover:bg-brand-light font-semibold text-sm transition-colors"
            aria-label="Back to home page"
          >
            <ArrowLeft size={16} className="text-brand-dark" />
            Back to Home
          </Link>
        ) : (
          /* On /: show "Open Dashboard" */
          <Link
            to="/dashboard"
            id="open-dashboard-nav"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-dark text-white text-sm font-semibold hover:bg-brand-mid transition-colors shadow-sm"
          >
            <LayoutDashboard size={16} />
            Open Dashboard
          </Link>
        )}
      </div>
    </header>
  );
}
