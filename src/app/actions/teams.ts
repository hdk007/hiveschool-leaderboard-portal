"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireAdmin } from "@/lib/auth";
import { teamSchema, type TeamInput } from "@/lib/validators";

export interface MutationResult {
  ok: boolean;
  error?: string;
  id?: string;
}

function revalidateTeamPages() {
  revalidatePath("/leaderboard");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/leaderboard");
  revalidatePath("/admin/teams");
}

export async function createTeam(input: TeamInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = teamSchema.parse(input);
    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from("teams")
      .insert(data)
      .select("id")
      .single();
    if (error) throw error;

    await logActivity({ action: "created", entity_type: "team", entity_id: row.id, metadata: { name: data.name } });
    revalidateTeamPages();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create team" };
  }
}

export async function updateTeam(id: string, input: TeamInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = teamSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from("teams")
      .update(data)
      .eq("id", id);
    if (error) throw error;

    await logActivity({ action: "updated", entity_type: "team", entity_id: id, metadata: { name: data.name } });
    revalidateTeamPages();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update team" };
  }
}

export async function deleteTeam(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) throw error;

    await logActivity({ action: "deleted", entity_type: "team", entity_id: id });
    revalidateTeamPages();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete team" };
  }
}

export async function snapshotLeaderboard(): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("snapshot_leaderboard");
    if (error) throw error;
    await logActivity({ action: "snapshot", entity_type: "leaderboard", entity_id: "all" });
    revalidateTeamPages();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to snapshot leaderboard" };
  }
}
