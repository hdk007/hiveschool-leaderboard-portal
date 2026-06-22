"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime";

/**
 * Drop-in client component that re-renders the current server route whenever any
 * of the given tables change. Placed in layouts/pages to make SSR content live.
 */
export function RealtimeRefresher({ tables }: { tables: string[] }) {
  useRealtimeRefresh(tables);
  return null;
}
