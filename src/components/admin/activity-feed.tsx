"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, RefreshCw, LogIn, Award, Camera, Activity as ActivityIcon } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import type { ActivityLog } from "@/types/database";

const ACTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  created: { icon: Plus, color: "#10B981" },
  updated: { icon: Pencil, color: "#6366F1" },
  deleted: { icon: Trash2, color: "#EF4444" },
  recalculated: { icon: RefreshCw, color: "#7C3AED" },
  snapshot: { icon: Camera, color: "#0EA5E9" },
  login: { icon: LogIn, color: "#F59E0B" },
  awarded: { icon: Award, color: "#EC4899" },
};

function describe(log: ActivityLog) {
  const name = (log.metadata?.name || log.metadata?.title) as string | undefined;
  const entity = log.entity_type ?? "item";
  const subject = name ? `“${name}”` : entity;
  switch (log.action) {
    case "created": return `Created ${entity} ${subject}`;
    case "updated": return `Updated ${entity} ${subject}`;
    case "deleted": return `Deleted ${entity}`;
    case "recalculated": return "Recalculated the leaderboard";
    case "snapshot": return "Captured a leaderboard snapshot";
    case "login": return "Signed in";
    case "awarded": return "Awarded an achievement";
    default: return `${log.action} ${entity}`;
  }
}

export function ActivityFeed({ initial }: { initial: ActivityLog[] }) {
  const [logs, setLogs] = React.useState<ActivityLog[]>(initial);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        setLogs((prev) => [payload.new as ActivityLog, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (logs.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <ul className="space-y-1">
      <AnimatePresence initial={false}>
        {logs.map((log) => {
          const meta = ACTION_META[log.action] ?? { icon: ActivityIcon, color: "#6B7280" };
          const Ico = meta.icon;
          return (
            <motion.li
              key={log.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/60"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}>
                <Ico className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{describe(log)}</p>
                <p className="text-xs text-muted-foreground">
                  {log.performed_by ?? "system"} · {timeAgo(log.created_at)}
                </p>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
