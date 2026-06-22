"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Safe to use in client components — it only ever sees
 * the anon key and is fully governed by Row Level Security. Used for live
 * Realtime subscriptions and React Query reads.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// A singleton is convenient for Realtime channels (one socket per tab).
let browserClient: ReturnType<typeof createClient> | undefined;
export function getSupabaseBrowserClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}
