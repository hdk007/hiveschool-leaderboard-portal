"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AchievementBadge } from "@/components/shared/achievement-badge";
import type { Achievement } from "@/types/database";

type AchievementWithCount = Achievement & { count: number };

export function AchievementsGrid({ achievements }: { achievements: AchievementWithCount[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(i * 0.04, 0.4) }}
        >
          <Card className="flex h-full items-start gap-4 p-5 hover:shadow-glow">
            <AchievementBadge achievement={a} size="lg" animateUnlock />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{a.title}</h3>
                <Badge variant="accent" className="shrink-0">{a.count} earned</Badge>
              </div>
              {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
              {a.criteria && (
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  <span className="text-foreground">Criteria:</span> {a.criteria}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
