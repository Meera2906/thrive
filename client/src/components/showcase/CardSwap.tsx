/**
 * CardSwap — GSAP-powered stacked card carousel.
 *
 * Props
 * ─────
 * width          Card width in px (default 320)
 * height         Card height in px (default 220)
 * cardDistance   Horizontal spread between stacked cards (default 60)
 * verticalDistance Vertical offset per card in the stack (default 10)
 * delay          Auto-advance interval in seconds (default 5)
 * pauseOnHover   Pause auto-advance while cursor is over the stack
 * skewAmount     Skew applied to non-front cards in degrees (default 6)
 * easing         GSAP ease string: 'linear' | 'elastic.out(1,0.5)' etc (default 'elastic.out(1,0.5)')
 * onCardClick    Called with the index of the clicked card
 * children       <Card> elements
 */
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  Children,
  isValidElement,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react";
import gsap from "gsap";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

/* ── Card sub-component ─────────────────────────────────────────────────── */

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ customClass, className, children, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 rounded-2xl border cursor-pointer select-none",
          customClass,
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

/* ── CardSwap ───────────────────────────────────────────────────────────── */

export interface CardSwapProps {
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  skewAmount?: number;
  easing?: string;
  onCardClick?: (index: number) => void;
  children: ReactNode;
}

export default function CardSwap({
  width = 320,
  height = 220,
  cardDistance = 60,
  verticalDistance = 10,
  delay = 5,
  pauseOnHover = true,
  skewAmount = 6,
  easing = "elastic.out(1,0.5)",
  onCardClick,
  children,
}: CardSwapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orderRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = useRef(false);
  const [count, setCount] = useState(0); // triggers layout after refs are mounted

  const cards = Children.toArray(children).filter(isValidElement);
  const n = cards.length;

  /* Initialise / update stack positions */
  const applyLayout = useCallback(
    (order: number[], animate = false) => {
      order.forEach((cardIdx, stackPos) => {
        const el = cardRefs.current[cardIdx];
        if (!el) return;

        const isFront = stackPos === 0;
        const x = isFront ? 0 : cardDistance * stackPos;
        const y = isFront ? 0 : verticalDistance * stackPos;
        const skewY = isFront ? 0 : -skewAmount;
        const scale = 1 - stackPos * 0.04;
        const zIndex = n - stackPos;
        const opacity = stackPos >= n - 1 ? 0 : 1;

        if (animate) {
          gsap.to(el, { x, y, skewY, scale, zIndex, opacity, duration: 0.6, ease: easing });
        } else {
          gsap.set(el, { x, y, skewY, scale, zIndex, opacity });
        }
      });
    },
    [cardDistance, verticalDistance, skewAmount, easing, n]
  );

  /* Advance: move front card to back */
  const advance = useCallback(() => {
    if (paused.current || n < 2) return;
    const newOrder = [...orderRef.current];
    const front = newOrder.shift()!;
    newOrder.push(front);
    orderRef.current = newOrder;
    applyLayout(newOrder, true);
  }, [applyLayout, n]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      advance();
      scheduleNext();
    }, delay * 1000);
  }, [advance, delay]);

  /* Build initial order and layout */
  useEffect(() => {
    orderRef.current = Array.from({ length: n }, (_, i) => i);
    applyLayout(orderRef.current, false);
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, n]);

  /* Force re-run once refs are populated */
  useEffect(() => setCount((c) => c + 1), []);

  const handleClick = (cardIdx: number) => {
    const stackPos = orderRef.current.indexOf(cardIdx);
    if (stackPos === 0) {
      onCardClick?.(cardIdx);
    } else {
      const newOrder = [...orderRef.current];
      newOrder.splice(stackPos, 1);
      newOrder.unshift(cardIdx);
      orderRef.current = newOrder;
      applyLayout(newOrder, true);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height, position: "relative" }}
      onMouseEnter={() => { if (pauseOnHover) paused.current = true; }}
      onMouseLeave={() => {
        if (pauseOnHover) {
          paused.current = false;
          scheduleNext();
        }
      }}
    >
      {cards.map((child, cardIdx) => {
        const element = child as React.ReactElement<CardProps>;
        return (
          <Card
            key={cardIdx}
            ref={(el) => { cardRefs.current[cardIdx] = el; }}
            customClass={element.props.customClass}
            className={element.props.className}
            style={{ width, height, ...((element.props.style) ?? {}) }}
            onClick={(e) => {
              handleClick(cardIdx);
              element.props.onClick?.(e);
            }}
          >
            {element.props.children}
          </Card>
        );
      })}
    </div>
  );
}
