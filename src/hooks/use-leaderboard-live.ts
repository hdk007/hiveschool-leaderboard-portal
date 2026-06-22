"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Team } from "@/types/database";

/**
 * Live leaderboard state. Seeds from the SSR-provided rows, then keeps an
 * in-memory list in sync via Realtime so rank movement can be animated (e.g.
 * Framer Motion layout animation) without a full page refresh.
 *
 * Returns the teams always sorted by rank, plus a set of ids that just moved
 * up / down so the UI can flash change indicators.
 */
export function useLeaderboardLive(initial: Team[]) {
  const [teams, setTeams] = useState<Team[]>(initial);
  const [moved, setMoved] = useState<Record<string, "up" | "down">>({});
  const movedRef = useRef<Record<string, "up" | "down">>({});

  // Re-seed when the server sends fresh data (e.g. filter/page change).
  useEffect(() => {
    setTeams(initial);
  }, [initial]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("leaderboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        (payload) => {
          setTeams((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== (payload.old as Team).id);
            }
            const next = payload.new as Team;
            const existing = prev.find((t) => t.id === next.id);
            if (existing && existing.rank != null && next.rank != null) {
              if (next.rank < existing.rank) movedRef.current[next.id] = "up";
              else if (next.rank > existing.rank) movedRef.current[next.id] = "down";
            }
            if (existing) return prev.map((t) => (t.id === next.id ? next : t));
            return [...prev, next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sorted = useMemo(
    () => [...teams].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
    [teams]
  );

  return { teams: sorted, moved: movedRef.current };
}
