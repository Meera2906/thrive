/**
 * ScoringJourney
 * A dark full-width section that walks through the real scoring pipeline
 * while an SVG winding path draws on scroll.
 *
 * Pipeline (from README scoring model):
 *   Patient Data → 6 Weighted Factors → Score (capped at 100) → Tier → Action
 */
import { useEffect, useRef, useState } from "react";
import {
  Database,
  ListChecks,
  Gauge,
  Layers,
  ArrowRightCircle,
} from "lucide-react";
import ScrollDrawLine from "./ScrollDrawLine";

/* The SVG canvas is 800 × 420. The winding path visits 5 X stations. */
const PATH_D =
  "M 60 60 C 200 60, 200 140, 340 140 C 480 140, 480 60, 620 60 C 700 60, 740 140, 740 210 C 740 280, 660 360, 500 360 C 340 360, 260 280, 160 280 C 80 280, 60 360, 60 420";

/* Approximate t-progress (0-1) where each waypoint sits on the path */
const STOPS = [
  {
    progress: 0.0,
    label: "Patient Data",
    Icon: Database,
    color: "text-teal-400",
    ring: "ring-teal-700",
    detail: "18 synthetic patients (real data source swappable)",
    x: 60,
    y: 60,
  },
  {
    progress: 0.25,
    label: "6 Weighted Factors",
    Icon: ListChecks,
    color: "text-indigo-400",
    ring: "ring-indigo-700",
    detail:
      "Missed ratio (35 pts) · Overdue (20 pts) · Distance (15 pts) · Fatigue (15 pts) · Age (10 pts) · Frequency (5 pts)",
    x: 620,
    y: 60,
  },
  {
    progress: 0.5,
    label: "Score (capped at 100)",
    Icon: Gauge,
    color: "text-amber-400",
    ring: "ring-amber-700",
    detail: "Raw factor sum is floored at 0 and capped at 100",
    x: 740,
    y: 210,
  },
  {
    progress: 0.7,
    label: "Tier Assigned",
    Icon: Layers,
    color: "text-rose-400",
    ring: "ring-rose-700",
    detail: "≥ 55 → High · ≥ 30 → Medium · else → Low · < 2 appts → Insufficient history",
    x: 160,
    y: 280,
  },
  {
    progress: 0.95,
    label: "Suggested Action",
    Icon: ArrowRightCircle,
    color: "text-green-400",
    ring: "ring-green-700",
    detail:
      "Top-2 highest-scoring factors map to plain-English next steps via riskWeights.ts",
    x: 60,
    y: 420,
  },
];

export default function ScoringJourney() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  /* Mirror the scroll progress from ScrollDrawLine so we can fade-in stops */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { setScrollProgress(1); return; }

    let raf: number | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startRaf();
        else stopRaf();
      },
      { threshold: 0 }
    );
    io.observe(section);

    function tick() {
      const rect = section!.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const p = Math.min(1, Math.max(0, (viewportH - rect.top) / (rect.height + viewportH)));
      setScrollProgress(p);
      raf = requestAnimationFrame(tick);
    }

    function startRaf() { raf = requestAnimationFrame(tick); }
    function stopRaf() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    return () => { io.disconnect(); stopRaf(); };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 overflow-hidden bg-slate-900/80"
      aria-label="Scoring pipeline walkthrough"
    >
      {/* Faint radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-900/20 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-4">
          How every score is calculated
        </h2>
        <p className="text-center text-slate-400 mb-12 max-w-xl mx-auto text-sm">
          No black box — every point is traceable to a plain-English rule. Follow
          the line as the algorithm runs.
        </p>

        {/* SVG canvas — relative container so waypoints can be absolutely positioned */}
        <div className="relative w-full" style={{ paddingBottom: "52.5%" /* 420/800 */ }}>
          {/* Draw line fills 100% of the container */}
          <div className="absolute inset-0">
            <ScrollDrawLine
              d={PATH_D}
              viewBox="0 0 800 420"
              strokeColor="#0d9488"
              strokeWidth={2.5}
              width="100%"
              height="100%"
            />
          </div>

          {/* Waypoint cards — positioned to match path anchors (% of 800×420) */}
          {STOPS.map((stop, i) => {
            const revealed = scrollProgress >= stop.progress - 0.05;
            return (
              <div
                key={stop.label}
                className="absolute"
                style={{
                  left: `${(stop.x / 800) * 100}%`,
                  top: `${(stop.y / 420) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  opacity: revealed ? 1 : 0,
                  translate: revealed ? "0 0" : "0 12px",
                  zIndex: 10,
                }}
              >
                <div
                  className={`flex flex-col items-center gap-1.5 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 ring-1 ${stop.ring} shadow-xl max-w-[160px]`}
                  style={{ minWidth: "120px" }}
                >
                  <div className={`flex items-center gap-1.5 ${stop.color}`}>
                    <stop.Icon size={16} />
                    <span className="text-xs font-bold whitespace-nowrap">
                      {i + 1}. {stop.label}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-tight text-center">
                    {stop.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
