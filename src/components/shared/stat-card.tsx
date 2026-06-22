"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  ClipboardCheck,
  IndianRupee,
  RefreshCw,
  CalendarCheck,
  Swords,
  Megaphone,
  Trophy,
  Award,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { AnimatedCounter } from "@/components/animated-counter";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  UserCheck,
  ClipboardCheck,
  IndianRupee,
  RefreshCw,
  CalendarCheck,
  Swords,
  Megaphone,
  Trophy,
  Award,
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string | LucideIcon;
  format?: "currency" | "percent" | "percent1" | "decimal" | "number" | ((v: number) => string);
  hint?: string;
  trend?: number;
  accent?: string;
  index?: number;
}

/** A premium animated KPI card used on the landing page and admin dashboards. */
export function StatCard({ label, value, icon, format, hint, trend, accent = "#7C3AED", index = 0 }: StatCardProps) {
  const IconComponent = typeof icon === "string" ? ICON_MAP[icon] || HelpCircle : icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden p-5 hover:shadow-glow">
        <div
          className="absolute -right-6 -top-6 size-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
          style={{ backgroundColor: accent }}
        />
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular tracking-tight sm:text-3xl">
              <AnimatedCounter value={value} format={format} />
            </p>
          </div>
          <span
            className="flex size-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <IconComponent className="size-5" />
          </span>
        </div>
        {(hint || trend !== undefined) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  "font-semibold",
                  trend >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
