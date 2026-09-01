/**
 * LandingPage — "/"
 * Three sections:
 *  1. Hero   — ParallaxAtmosphere backdrop + animated headline + CardSwap showcase
 *  2. Journey — scroll-drawn SVG scoring pipeline (dark slate section)
 *  3. CTA    — call-to-action to open the dashboard
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Header from "../components/Header";
import RiskFactorShowcase from "../components/showcase/RiskFactorShowcase";
import ScoringJourney from "../components/showcase/ScoringJourney";
import ParallaxAtmosphere from "../components/showcase/ParallaxAtmosphere";
import HospitalLoader from "../components/showcase/HospitalLoader";
import { useEffect, useState } from "react";
import { StatsResponse } from "../types";

/* Word-by-word headline reveal */
const HEADLINE = "Know who needs you next.";
const words = HEADLINE.split(" ");

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
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
  // Brief stats-resolving state — shows HospitalLoader until /api/stats returns
  const [statsReady, setStatsReady] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((_data: StatsResponse) => setStatsReady(true))
      .catch(() => setStatsReady(true)); // on error, skip loader
    // Short safety timeout so the page doesn't wait forever
    const t = setTimeout(() => setStatsReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!statsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <HospitalLoader />
      </div>
    );
  }

  return (
    <div className="w-full text-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Header />

      <section
        className="relative flex flex-col items-center justify-center px-6 py-20 overflow-hidden"
        style={{ minHeight: "calc(100vh - 73px)" }}
        aria-label="Hero"
      >
        {/* Extra pink glow overlays — complement the parallax */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-brand/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div>
            {/* Pill badge — brand themed */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-brand/40 bg-brand/10 text-brand text-xs font-semibold shadow-[0_0_15px_rgba(247,163,180,0.2)]"
            >
              <Sparkles size={13} />
              Rule-based · Fully explainable · Zero ML
            </motion.div>

            {/* Animated headline — brand gradient */}
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
              className="text-white/70 text-lg leading-relaxed mb-8 max-w-md"
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
              {/* Primary CTA — brand.dark bg, white text (≥7:1) */}
              <Link
                to="/dashboard"
                id="hero-open-dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark hover:bg-brand-mid text-white font-bold text-sm transition-all shadow-lg shadow-brand-dark/40 hover:-translate-y-0.5"
              >
                Open Dashboard
                <ArrowRight size={16} />
              </Link>
              <a
                href="#scoring"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 font-semibold text-sm transition-all"
              >
                See how it works
              </a>
            </motion.div>

            {/* Stats strip — brand accent numbers */}
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
                  {/* brand.DEFAULT on dark parallax bg: #f7a3b4 on ~#1a0a10 ≈ 6:1 ✅ */}
                  <div className="text-2xl font-black text-brand">{s.value}</div>
                  <div className="text-xs text-white/40">{s.label}</div>
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
            <p className="text-white/40 text-xs mt-2 text-center max-w-[300px]">
              Click a tier card to jump to that filtered view.
              Cards auto-rotate — hover to pause.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Scoring Journey (transparent on parallax bg) ─────────────────── */}
      <div id="scoring" className="w-full">
        <ScoringJourney />
      </div>

      {/* ── CTA section ──────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        aria-label="Call to action"
      >
        {/* Brand glow wash */}
        <div className="absolute inset-0  pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-4 text-white">
              Ready to see your list?
            </h2>
            <p className="text-white/60 mb-10 text-lg">
              18 synthetic patients are already loaded — open the dashboard and
              explore who needs you most.
            </p>
            {/* brand.dark bg, white text ≥7:1 ✅ */}
            <Link
              to="/dashboard"
              id="cta-open-dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-brand-dark hover:bg-brand-mid text-white font-black text-lg transition-all shadow-2xl shadow-brand-dark/40 hover:-translate-y-1"
            >
              Open the Dashboard
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-white/40 text-xs">
        CareCompass — Patient Follow-up Risk Predictor · Transparent rule engine · No ML
      </footer>
    </div>
  );
}
