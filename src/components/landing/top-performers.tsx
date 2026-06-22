"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RankBadge } from "@/components/shared/rank-badge";
import { TeamProfileModal } from "@/components/modals/team-profile-modal";
import type { Team } from "@/types/database";

/** Top-3 performers preview on the landing page. Clicking opens the team details modal. */
export function TopPerformers({ teams }: { teams: Team[] }) {
  const [selected, setSelected] = React.useState<Team | null>(null);
  const [open, setOpen] = React.useState(false);

  const podium = teams.slice(0, 3);

  const click = (t: Team) => {
    setSelected(t);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podium.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={i === 0 ? "sm:-mt-4" : ""}
          >
            <Card
              onClick={() => click(t)}
              className="group relative cursor-pointer overflow-hidden p-6 text-center hover:shadow-glow"
            >
              {i === 0 && (
                <Crown className="absolute left-1/2 top-3 size-6 -translate-x-1/2 text-amber-400" />
              )}
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar src={t.team_logo} name={t.name} size={72} />
                  <span className="absolute -bottom-1 -right-1">
                    <RankBadge rank={t.rank} />
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Captain: {t.captain_name || "None"}</p>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 pt-2 text-sm">
                  <div className="rounded-lg bg-secondary/60 p-2">
                    <p className="text-xs text-muted-foreground">Total Points</p>
                    <p className="font-bold tabular">{Number(t.total_points).toFixed(1)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-2">
                    <p className="text-xs text-muted-foreground">Students</p>
                    <p className="font-bold tabular">{t.total_students}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <TeamProfileModal team={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
