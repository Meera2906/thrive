import { Link, useLocation } from "react-router-dom";
import { HeartPulse, LayoutDashboard } from "lucide-react";

interface Props {
  /** When true, renders with a glassmorphism style (for the landing page dark hero). */
  transparent?: boolean;
}

export default function Header({ transparent = false }: Props) {
  const location = useLocation();
  const isOnDashboard = location.pathname === "/dashboard";

  return (
    <header
      className={
        transparent
          ? "border-b border-white/10 bg-white/5 backdrop-blur-md"
          : "border-b border-slate-200 bg-white"
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
        {/* Logo — clicking goes to "/" */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="Thrive home">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
            <HeartPulse className="text-white" size={22} />
          </div>
          <div>
            <div
              className={`text-lg font-bold leading-tight ${
                transparent ? "text-white" : "text-slate-900"
              }`}
            >
              Patient Follow-up Risk Predictor
            </div>
            <p
              className={`text-sm leading-tight ${
                transparent ? "text-white/60" : "text-slate-500"
              }`}
            >
              Transparent, rule-based follow-up drop-out risk ranking
            </p>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Dashboard nav link — only shown when not already on /dashboard */}
        {!isOnDashboard && (
          <Link
            to="/dashboard"
            id="open-dashboard-nav"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 transition-colors shadow-sm"
          >
            <LayoutDashboard size={16} />
            Open Dashboard
          </Link>
        )}
      </div>
    </header>
  );
}
