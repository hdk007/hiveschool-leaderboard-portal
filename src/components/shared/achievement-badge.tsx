"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types/database";

interface AchievementBadgeProps {
  achievement: Pick<Achievement, "title" | "icon" | "color">;
  size?: "sm" | "md" | "lg";
  locked?: boolean;
  showLabel?: boolean;
  /** Triggers the unlock pop animation. */
  animateUnlock?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: "size-9", icon: 16 },
  md: { box: "size-12", icon: 22 },
  lg: { box: "size-16", icon: 30 },
};

export function AchievementBadge({
  achievement,
  size = "md",
  locked = false,
  showLabel = false,
  animateUnlock = false,
  className,
}: AchievementBadgeProps) {
  const s = SIZES[size];
  return (
    <div className={cn("flex flex-col items-center gap-2", className)} title={achievement.title}>
      <motion.span
        initial={animateUnlock ? { scale: 0, rotate: -30 } : false}
        animate={animateUnlock ? { scale: 1, rotate: 0 } : undefined}
        transition={{ type: "spring", bounce: 0.5, duration: 0.7 }}
        className={cn(
          "relative flex items-center justify-center rounded-2xl shadow-soft",
          s.box,
          locked && "opacity-40 grayscale"
        )}
        style={{
          backgroundColor: locked ? undefined : `${achievement.color}1f`,
          color: achievement.color,
        }}
      >
        <Icon name={achievement.icon} size={s.icon} />
        {animateUnlock && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            initial={{ boxShadow: `0 0 0 0 ${achievement.color}80` }}
            animate={{ boxShadow: `0 0 0 14px ${achievement.color}00` }}
            transition={{ duration: 1, repeat: 2 }}
          />
        )}
      </motion.span>
      {showLabel && <span className="text-center text-xs font-medium text-muted-foreground">{achievement.title}</span>}
    </div>
  );
}
