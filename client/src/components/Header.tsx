import { Link, useLocation } from "react-router-dom";
import { HeartPulse, LayoutDashboard, UploadCloud, PhoneCall, Mail, ArrowLeft } from "lucide-react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload Data", icon: UploadCloud },
  { to: "/calls", label: "Call List", icon: PhoneCall },
  { to: "/emails", label: "Bulk Email", icon: Mail },
];

export default function Header() {
  const location = useLocation();
  const isOnLanding = location.pathname === "/";

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3 flex-wrap">
        {/* Logo — clicking goes to "/" always */}
        <Link to="/" className="flex items-center gap-3 group" aria-label="CareCompass home">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-colors bg-brand group-hover:bg-brand/80 shrink-0">
            <HeartPulse className="text-white" size={22} />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-white">
              CareCompass
            </div>
            <p className="text-sm leading-tight text-white/60">
              Transparent, rule-based follow-up drop-out risk ranking
            </p>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {isOnLanding ? (
          <Link
            to="/dashboard"
            id="open-dashboard-nav"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-dark text-white text-sm font-semibold hover:bg-brand-mid transition-colors shadow-sm"
          >
            <LayoutDashboard size={16} />
            Open Dashboard
          </Link>
        ) : (
          <nav className="flex items-center gap-1 flex-wrap" aria-label="Main">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-dark text-white shadow-sm"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 pl-3 ml-1 border-l border-white/10 text-white/50 hover:text-white text-sm transition-colors"
              aria-label="Back to home page"
            >
              <ArrowLeft size={14} />
              Home
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
