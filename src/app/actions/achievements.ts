"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, pushNotification, requireAdmin } from "@/lib/auth";
import { achievementSchema, type AchievementInput } from "@/lib/validators";
import type { MutationResult } from "./students";

function revalidate() {
  revalidatePath("/achievements");
  revalidatePath("/admin/achievements");
}

export async function createAchievement(input: AchievementInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = achievementSchema.parse(input);
    const supabase = await createClient();
    const { data: row, error } = await supabase.from("achievements").insert(data).select("id").single();
    if (error) throw error;
    await logActivity({ action: "created", entity_type: "achievement", entity_id: row.id, metadata: { title: data.title } });
    await pushNotification({ type: "achievement", title: `New badge: ${data.title}`, message: data.description ?? undefined, link: "/achievements" });
    revalidate();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create achievement" };
  }
}

export async function updateAchievement(id: string, input: AchievementInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = achievementSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("achievements").update(data).eq("id", id);
    if (error) throw error;
    await logActivity({ action: "updated", entity_type: "achievement", entity_id: id, metadata: { title: data.title } });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update achievement" };
  }
}

export async function deleteAchievement(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ action: "deleted", entity_type: "achievement", entity_id: id });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete achievement" };
  }
}
