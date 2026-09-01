/**
 * SummaryCards
 * Tier count tiles with Framer Motion count-up animation on mount.
 */
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { StatsResponse } from "../types";

interface CardDef {
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
}

/** Animated number that counts from 0 → target on mount */
function CountUp({ to }: { to: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Small delay so the card itself has time to mount visually
      const ctrl = animate(motionValue, to, { duration: 1.2, ease: "easeOut" });
      return () => ctrl.stop();
    } else {
      // If the value changes later (e.g. retry), animate to new value
      const ctrl = animate(motionValue, to, { duration: 0.8, ease: "easeOut" });
      return () => ctrl.stop();
    }
  }, [to, motionValue]);

  return <motion.span>{display}</motion.span>;
}

export default function SummaryCards({ stats }: { stats: StatsResponse | null }) {
  const cards: CardDef[] = [
    {
      label: "High Risk",
      value: stats?.high ?? 0,
      colorClass: "text-red-400",
      bgClass: "bg-red-900/20 border-red-500/30",
    },
    {
      label: "Medium Risk",
      value: stats?.medium ?? 0,
      colorClass: "text-amber-400",
      bgClass: "bg-amber-900/20 border-amber-500/30",
    },
    {
      label: "Low Risk",
      value: stats?.low ?? 0,
      colorClass: "text-teal-400",
      bgClass: "bg-teal-900/20 border-teal-500/30",
    },
    {
      label: "Insufficient History",
      value: stats?.insufficientHistory ?? 0,
      colorClass: "text-white/60",
      bgClass: "bg-white/5 border-white/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          className={`rounded-xl border p-4 ${c.bgClass}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
        >
          <div className={`text-2xl font-bold ${c.colorClass}`}>
            {stats !== null ? <CountUp to={c.value} /> : "—"}
          </div>
          <div className="text-sm text-white/60 mt-0.5">{c.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
