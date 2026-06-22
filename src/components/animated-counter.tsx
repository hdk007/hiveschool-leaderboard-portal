"use client";

import * as React from "react";
import { animate, useInView } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  /** Format the running value (e.g. currency / compact). */
  format?: "currency" | "percent" | "percent1" | "decimal" | "number" | ((v: number) => string);
  duration?: number;
  className?: string;
}

/**
 * Counts up to `value` when it scrolls into view, and re-animates when the value
 * changes (used for live revenue / stat updates).
 */
export function AnimatedCounter({ value, format, duration = 1.2, className }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = React.useState(0);
  const prev = React.useRef(0);

  const formatFn = React.useMemo(() => {
    if (!format) return undefined;
    if (typeof format === "function") return format;
    switch (format) {
      case "currency":
        return (v: number) => formatCurrency(v, { compact: true });
      case "percent":
        return (v: number) => `${Math.round(v)}%`;
      case "percent1":
        return (v: number) => `${v.toFixed(1)}%`;
      case "decimal":
        return (v: number) => v.toFixed(1);
      case "number":
        return (v: number) => Math.round(v).toLocaleString();
      default:
        return undefined;
    }
  }, [format]);

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, inView, duration]);

  return (
    <span ref={ref} className={className}>
      {formatFn ? formatFn(display) : Math.round(display).toLocaleString()}
    </span>
  );
}
