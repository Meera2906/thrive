/**
 * ScrollDrawLine
 * Animates an SVG path's stroke from 0 → fully drawn as the user scrolls
 * through its parent section. Uses IntersectionObserver to scope to its
 * own container and requestAnimationFrame for smooth rendering.
 *
 * Respects prefers-reduced-motion: renders fully drawn immediately.
 */
import { useEffect, useRef } from "react";

interface Props {
  /** SVG path `d` attribute */
  d: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  /** viewBox for the inner <svg>, e.g. "0 0 800 400" */
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  /** Explicit scroll progress override (0 to 1) */
  progress?: number;
}

export default function ScrollDrawLine({
  d,
  strokeColor = "#0d9488",
  strokeWidth = 3,
  className = "",
  viewBox = "0 0 800 400",
  width = "100%",
  height = "100%",
  progress: explicitProgress,
}: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(false);

  // If explicitProgress is provided, update path style directly on progress change
  useEffect(() => {
    if (explicitProgress === undefined) return;
    const path = pathRef.current;
    if (!path) return;

    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = `${totalLength}`;
    const p = Math.min(1, Math.max(0, explicitProgress));
    path.style.strokeDashoffset = `${totalLength * (1 - p)}`;
  }, [explicitProgress, d]);

  useEffect(() => {
    if (explicitProgress !== undefined) return;

    const path = pathRef.current;
    const section = sectionRef.current;
    if (!path || !section) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const totalLength = path.getTotalLength();

    if (prefersReduced) {
      path.style.strokeDasharray = `${totalLength}`;
      path.style.strokeDashoffset = "0";
      return;
    }

    // Start fully hidden
    path.style.strokeDasharray = `${totalLength}`;
    path.style.strokeDashoffset = `${totalLength}`;

    // IntersectionObserver — track visibility of the section
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) startRaf();
        else stopRaf();
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(section);

    function draw() {
      const rect = section!.getBoundingClientRect();
      const viewportH = window.innerHeight;

      const start = viewportH * 0.7;
      const end = -rect.height + viewportH * 0.7;
      const distance = start - end;
      const progress = Math.min(
        1,
        Math.max(0, (start - rect.top) / (distance || 1))
      );

      path!.style.strokeDashoffset = `${totalLength * (1 - progress)}`;

      if (visibleRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    function startRaf() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    }

    function stopRaf() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      io.disconnect();
      stopRaf();
    };
  }, [d, explicitProgress]);

  return (
    <div ref={sectionRef} className={`pointer-events-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Faint ghost track */}
        <path
          d={d}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeOpacity={0.12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Animated draw path */}
        <path
          ref={pathRef}
          d={d}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.9}
        />
      </svg>
    </div>
  );
}
