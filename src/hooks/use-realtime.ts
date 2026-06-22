"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribe to Postgres changes on one or more tables and refresh the current
 * route (re-running server components) whenever data changes. This is the
 * simplest way to get live, no-refresh updates on SSR pages.
 *
 * Refreshes are debounced so a burst of changes (e.g. a leaderboard recompute
 * touching 50 rows) results in a single refresh.
 */
export function useRealtimeRefresh(tables: string[], enabled = true) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabaseBrowserClient();
    const channel = supabase.channel(`realtime:${tables.join("-")}`);

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 350);
    };

    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }

    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join("-"), enabled]);
}
