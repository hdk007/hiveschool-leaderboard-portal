"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireAdmin } from "@/lib/auth";
import { settingsSchema, type SettingsInput } from "@/lib/validators";
import type { MutationResult } from "./students";

/**
 * Update the leaderboard ranking weights. The DB trigger on
 * leaderboard_settings automatically recomputes every student's score + rank,
 * which Realtime then pushes to all connected clients.
 */
export async function updateSettings(input: SettingsInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = settingsSchema.parse(input);
    const supabase = await createClient();

    // Keep a single settings row: update the latest, or insert if none exists.
    const { data: existing } = await supabase
      .from("leaderboard_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // revenue_weight / challenge_weight are retained at 0 (challenges are scored
    // per team now) so the DB CHECK constraint (all four weights sum to 1) holds.
    const payload = { ...data, revenue_weight: 0, challenge_weight: 0 };

    if (existing) {
      const { error } = await supabase
        .from("leaderboard_settings")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("leaderboard_settings").insert(payload);
      if (error) throw error;
    }

    await logActivity({ action: "updated", entity_type: "settings", entity_id: "weights", metadata: data });
    revalidatePath("/admin/settings");
    revalidatePath("/admin/leaderboard");
    revalidatePath("/leaderboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update settings" };
  }
}

/** Persist a snapshot of the current standings into leaderboard_history. */
export async function snapshotLeaderboard(): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("snapshot_leaderboard");
    if (error) throw error;
    await logActivity({ action: "snapshot", entity_type: "leaderboard", entity_id: "all" });
    revalidatePath("/admin/analytics");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to snapshot" };
  }
}
