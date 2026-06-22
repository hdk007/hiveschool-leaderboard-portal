"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHALLENGE_STATUS_STYLES } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { DailyChallenge } from "@/types/database";

function timeLeft(deadline: string | null) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m left`;
}

export function ChallengeCard({
  challenge,
  participants,
  index,
}: {
  challenge: DailyChallenge;
  participants: number;
  index: number;
}) {
  const [remaining, setRemaining] = React.useState<string | null>(null);
  React.useEffect(() => {
    setRemaining(timeLeft(challenge.deadline));
    const t = setInterval(() => setRemaining(timeLeft(challenge.deadline)), 60000);
    return () => clearInterval(t);
  }, [challenge.deadline]);

  const status = CHALLENGE_STATUS_STYLES[challenge.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className="flex h-full flex-col p-5 hover:shadow-glow">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Zap className="size-5" />
          </span>
          <Badge className={cn("border-transparent", status.className)}>{status.label}</Badge>
        </div>

        <h3 className="mt-4 font-semibold">{challenge.title}</h3>
        {challenge.description && (
          <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{challenge.description}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Trophy className="size-4 text-warning" />
            <span className="font-semibold text-foreground tabular">{challenge.points}</span> pts
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4" />
            <span className="font-semibold text-foreground tabular">{participants}</span> graded
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {remaining ?? (challenge.deadline ? formatDate(challenge.deadline) : "No deadline")}
          </span>
          {challenge.leaderboard_impact && <span className="text-accent">{challenge.leaderboard_impact}</span>}
        </div>
      </Card>
    </motion.div>
  );
}
