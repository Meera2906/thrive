/**
 * LandingPage — "/"
 * The showcase entry point. Three sections:
 *  1. Hero   — animated headline + CardSwap risk tier carousel
 *  2. Journey — scroll-drawn SVG scoring pipeline
 *  3. CTA    — call-to-action to open the dashboard
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Header from "../components/Header";
import RiskFactorShowcase from "../components/showcase/RiskFactorShowcase";
import ScoringJourney from "../components/showcase/ScoringJourney";

/* Word-by-word headline reveal */
const HEADLINE = "Know who needs you next.";
const words = HEADLINE.split(" ");

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 32, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen landing-dark landing-grid-bg text-white">
      {/* Transparent header on the dark hero */}
      <Header transparent />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden"
        aria-label="Hero"
      >
        {/* Radial accent glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-teal-900/25 blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-900/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-teal-800 bg-teal-900/40 text-teal-300 text-xs font-semibold"
            >
              <Sparkles size={13} />
              Rule-based · Fully explainable · Zero ML
            </motion.div>

            {/* Animated headline */}
            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6"
              aria-label={HEADLINE}
            >
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className="inline-block mr-[0.25em] landing-hero-text"
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-slate-300 text-lg leading-relaxed mb-8 max-w-md"
            >
              Transparent, explainable patient follow-up risk ranking — no black
              box. Every score is traceable to a specific plain-English reason.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/dashboard"
                id="hero-open-dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition-all shadow-lg shadow-teal-900/40 hover:shadow-teal-800/60 hover:-translate-y-0.5"
              >
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
              <a
                href="#scoring"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 font-semibold text-sm transition-all"
              >
                See how it works
              </a>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="flex gap-6 mt-10 pt-8 border-t border-white/10"
            >
              {[
                { value: "6", label: "Scoring factors" },
                { value: "100%", label: "Explainable" },
                { value: "0", label: "ML black boxes" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-teal-300">{s.value}</div>
                  <div className="text-xs text-slate-500">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: CardSwap carousel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <RiskFactorShowcase />
            <p className="text-slate-500 text-xs mt-2 text-center max-w-[300px]">
              Click a tier card to jump straight to that filtered view in the dashboard.
              Cards auto-rotate — hover to pause.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Scoring Journey ──────────────────────────────────────────────── */}
      <div id="scoring">
        <ScoringJourney />
      </div>

      {/* ── Call to Action ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center relative overflow-hidden" aria-label="Call to action">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-teal-950/30 to-slate-900/0 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-4">
              Ready to see your list?
            </h2>
            <p className="text-slate-400 mb-10 text-lg">
              18 synthetic patients are already loaded — open the dashboard and
              explore who needs you most.
            </p>
            <Link
              to="/dashboard"
              id="cta-open-dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-black text-lg transition-all shadow-2xl shadow-teal-900/50 hover:shadow-teal-800/70 hover:-translate-y-1"
            >
              Open the Dashboard
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-slate-600 text-xs">
        Thrive — Patient Follow-up Risk Predictor · Transparent rule engine · No ML
      </footer>
    </div>
  );
}
