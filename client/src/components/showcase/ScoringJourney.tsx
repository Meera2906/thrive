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

/* The SVG canvas is 800 × 480. The winding path visits 5 X stations with generous padding. */
const PATH_D =
  "M 80 70 C 200 70, 200 150, 340 150 C 480 150, 480 70, 620 70 C 700 70, 720 150, 720 230 C 720 310, 640 390, 460 390 C 280 390, 240 310, 180 310 C 100 310, 100 380, 100 440";

/* Approximate t-progress (0-1) where each waypoint sits on the path */
const STOPS = [
  {
    progress: 0.0,
    label: "Patient Data",
    Icon: Database,
    color: "text-teal-300",
    ring: "ring-teal-500/60 border-teal-500/40",
    detail: "18 synthetic patients (real data source swappable)",
    x: 80,
    y: 70,
  },
  {
    progress: 0.25,
    label: "6 Weighted Factors",
    Icon: ListChecks,
    color: "text-indigo-300",
    ring: "ring-indigo-500/60 border-indigo-500/40",
    detail:
      "Missed ratio (35 pts) · Overdue (20 pts) · Distance (15 pts) · Fatigue (15 pts) · Age (10 pts) · Frequency (5 pts)",
    x: 620,
    y: 70,
  },
  {
    progress: 0.5,
    label: "Score (capped at 100)",
    Icon: Gauge,
    color: "text-amber-300",
    ring: "ring-amber-500/60 border-amber-500/40",
    detail: "Raw factor sum is floored at 0 and capped at 100",
    x: 720,
    y: 230,
  },
  {
    progress: 0.7,
    label: "Tier Assigned",
    Icon: Layers,
    color: "text-rose-300",
    ring: "ring-rose-500/60 border-rose-500/40",
    detail: "≥ 55 → High · ≥ 30 → Medium · else → Low · < 2 appts → Insufficient history",
    x: 180,
    y: 310,
  },
  {
    progress: 0.95,
    label: "Suggested Action",
    Icon: ArrowRightCircle,
    color: "text-emerald-300",
    ring: "ring-emerald-500/60 border-emerald-500/40",
    detail:
      "Top-2 highest-scoring factors map to plain-English next steps via riskWeights.ts",
    x: 100,
    y: 440,
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
      // Progress starts when section top reaches viewportH * 0.65 (in comfortable view)
      // Progress finishes as the user scrolls through the section diagram
      const start = viewportH * 0.65;
      const end = -rect.height + viewportH * 0.85;
      const distance = start - end;
      const p = Math.min(1, Math.max(0, (start - rect.top) / (distance || 1)));
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
      className="relative py-28 overflow-hidden bg-slate-950/60"
      aria-label="Scoring pipeline walkthrough"
    >
      {/* Faint radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-brand/15 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <h2 className="text-4xl sm:text-5xl font-black text-white text-center mb-5 tracking-tight">
          How every score is calculated
        </h2>
        <p className="text-center text-slate-300 mb-16 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed font-medium">
          No black box — every point is traceable to a plain-English rule. Follow
          the line as the algorithm runs.
        </p>

        {/* SVG canvas — relative container with larger aspect ratio for prominent cards */}
        <div className="relative w-full" style={{ paddingBottom: "60%" /* 480/800 */ }}>
          {/* Draw line fills 100% of the container */}
          <div className="absolute inset-0">
            <ScrollDrawLine
              d={PATH_D}
              viewBox="0 0 800 480"
              strokeColor="var(--brand)"
              strokeWidth={4}
              width="100%"
              height="100%"
              progress={scrollProgress}
            />
          </div>

          {/* Waypoint cards — positioned to match path anchors (% of 800×480) */}
          {STOPS.map((stop, i) => {
            const revealed = scrollProgress >= stop.progress - 0.05;
            return (
              <div
                key={stop.label}
                className="absolute"
                style={{
                  left: `${(stop.x / 800) * 100}%`,
                  top: `${(stop.y / 480) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  opacity: revealed ? 1 : 0,
                  translate: revealed ? "0 0" : "0 16px",
                  zIndex: 10,
                }}
              >
                <div
                  className={`flex flex-col items-center gap-2 bg-slate-900/95 backdrop-blur-md border-2 rounded-2xl p-4 sm:p-5 ring-2 ${stop.ring} shadow-2xl min-w-[200px] sm:min-w-[240px] max-w-[240px] sm:max-w-[280px] hover:scale-105 transition-transform duration-300`}
                >
                  <div className={`flex items-center gap-2.5 ${stop.color}`}>
                    <stop.Icon size={22} className="shrink-0" />
                    <span className="text-sm sm:text-base font-extrabold whitespace-nowrap tracking-wide">
                      {i + 1}. {stop.label}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium leading-snug text-center">
                    {stop.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* End of Journey Summary / Decoration */}
        <div 
          className="mt-24 flex flex-col items-center justify-center text-center transition-all duration-700"
          style={{
            opacity: scrollProgress > 0.95 ? 1 : 0,
            transform: scrollProgress > 0.95 ? "translateY(0)" : "translateY(20px)"
          }}
        >
          <div className="bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-8 sm:p-10 max-w-xl mx-auto shadow-2xl backdrop-blur-md flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(247,163,180,0.3)] animate-pulse">
              <ArrowRightCircle size={28} className="text-brand" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
              The Result: A Prioritized List
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
              Our algorithm translates these 6 factors into an actionable risk tier. You focus on patient care; the engine ensures no one falls through the cracks.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
