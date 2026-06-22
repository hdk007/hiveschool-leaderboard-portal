"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, pushNotification, requireAdmin } from "@/lib/auth";
import { announcementSchema, type AnnouncementInput } from "@/lib/validators";
import type { MutationResult } from "./students";

function revalidate() {
  revalidatePath("/announcements");
  revalidatePath("/");
  revalidatePath("/admin/announcements");
}

export async function createAnnouncement(input: AnnouncementInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = announcementSchema.parse(input);
    const supabase = await createClient();
    const { data: row, error } = await supabase.from("announcements").insert(data).select("id").single();
    if (error) throw error;
    await logActivity({ action: "created", entity_type: "announcement", entity_id: row.id, metadata: { title: data.title } });
    await pushNotification({ type: "announcement", title: data.title, message: data.description ?? undefined, link: "/announcements" });
    revalidate();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create announcement" };
  }
}

export async function updateAnnouncement(id: string, input: AnnouncementInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = announcementSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("announcements").update(data).eq("id", id);
    if (error) throw error;
    await logActivity({ action: "updated", entity_type: "announcement", entity_id: id, metadata: { title: data.title } });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update announcement" };
  }
}

export async function deleteAnnouncement(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ action: "deleted", entity_type: "announcement", entity_id: id });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete announcement" };
  }
}
