"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireAdmin } from "@/lib/auth";
import {
  moduleSchema,
  mentorSchema,
  campInfoSchema,
  type ModuleInput,
  type MentorInput,
  type CampInfoInput,
} from "@/lib/validators";
import type { MutationResult } from "./students";

function revalidate() {
  revalidatePath("/curriculum");
  revalidatePath("/");
  revalidatePath("/admin/curriculum");
}

export async function createModule(input: ModuleInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = moduleSchema.parse(input);
    const supabase = await createClient();

    // Server-authoritative ordering: always append a new module to the end so the
    // client never has to compute order_index (avoids collisions/races and lets you
    // add unlimited modules reliably). Editing can still re-order via updateModule.
    const { data: last } = await supabase
      .from("curriculum_modules")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const order_index = (Number(last?.order_index) || 0) + 1;

    const { data: row, error } = await supabase
      .from("curriculum_modules")
      .insert({ ...data, order_index })
      .select("id")
      .single();
    if (error) throw error;
    await logActivity({ action: "created", entity_type: "curriculum", entity_id: row.id, metadata: { name: data.module_name } });
    revalidate();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create module" };
  }
}

export async function updateModule(id: string, input: ModuleInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = moduleSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("curriculum_modules").update(data).eq("id", id);
    if (error) throw error;
    await logActivity({ action: "updated", entity_type: "curriculum", entity_id: id, metadata: { name: data.module_name } });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update module" };
  }
}

export async function deleteModule(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("curriculum_modules").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ action: "deleted", entity_type: "curriculum", entity_id: id });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete module" };
  }
}

// ---------------------------------------------------------------------------
// Mentors
// ---------------------------------------------------------------------------
export async function createMentor(input: MentorInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = mentorSchema.parse(input);
    const supabase = await createClient();
    const { data: last } = await supabase
      .from("mentors")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const order_index = data.order_index || (Number(last?.order_index) || 0) + 1;
    const { data: row, error } = await supabase
      .from("mentors")
      .insert({ ...data, photo: data.photo || null, order_index })
      .select("id")
      .single();
    if (error) throw error;
    await logActivity({ action: "created", entity_type: "mentor", entity_id: row.id, metadata: { name: data.name } });
    revalidate();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create mentor" };
  }
}

export async function updateMentor(id: string, input: MentorInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = mentorSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("mentors").update({ ...data, photo: data.photo || null }).eq("id", id);
    if (error) throw error;
    await logActivity({ action: "updated", entity_type: "mentor", entity_id: id, metadata: { name: data.name } });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update mentor" };
  }
}

export async function deleteMentor(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("mentors").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ action: "deleted", entity_type: "mentor", entity_id: id });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete mentor" };
  }
}

// ---------------------------------------------------------------------------
// Camp info (single row)
// ---------------------------------------------------------------------------
export async function updateCampInfo(input: CampInfoInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = campInfoSchema.parse(input);
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("camp_info")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("camp_info").update(data).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("camp_info").insert(data);
      if (error) throw error;
    }
    await logActivity({ action: "updated", entity_type: "camp_info", entity_id: "camp", metadata: { name: data.name } });
    revalidate();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update camp info" };
  }
}
