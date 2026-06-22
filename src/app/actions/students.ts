"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, requireAdmin } from "@/lib/auth";
import { studentSchema, type StudentInput } from "@/lib/validators";

export interface MutationResult {
  ok: boolean;
  error?: string;
  id?: string;
}

function revalidateStudentPages() {
  revalidatePath("/leaderboard");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/leaderboard");
  revalidatePath("/admin/teams");
}

export async function createStudent(input: StudentInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = studentSchema.parse(input);
    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from("students")
      .insert({ ...data, profile_image: data.profile_image || null })
      .select("id")
      .single();
    if (error) throw error;

    await logActivity({ action: "created", entity_type: "student", entity_id: row.id, metadata: { name: data.name } });
    revalidateStudentPages();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create student" };
  }
}

export async function updateStudent(id: string, input: StudentInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = studentSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from("students")
      .update({ ...data, profile_image: data.profile_image || null })
      .eq("id", id);
    if (error) throw error;

    await logActivity({ action: "updated", entity_type: "student", entity_id: id, metadata: { name: data.name } });
    revalidateStudentPages();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update student" };
  }
}

export async function deleteStudent(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;

    await logActivity({ action: "deleted", entity_type: "student", entity_id: id });
    revalidateStudentPages();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete student" };
  }
}

/** Manually trigger a leaderboard recompute (also runs automatically on writes). */
export async function recalculateLeaderboard(): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.rpc("recalculate_leaderboard");
    if (error) throw error;
    await logActivity({ action: "recalculated", entity_type: "leaderboard", entity_id: "all" });
    revalidateStudentPages();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to recalculate" };
  }
}

/** Award / revoke an achievement badge to a student. */
export async function awardAchievement(studentId: string, achievementId: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("student_achievements")
      .upsert({ student_id: studentId, achievement_id: achievementId }, { onConflict: "student_id,achievement_id" });
    if (error) throw error;
    await logActivity({ action: "awarded", entity_type: "achievement", entity_id: achievementId, metadata: { studentId } });
    revalidatePath("/admin/students");
    revalidatePath("/achievements");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to award achievement" };
  }
}

export async function revokeAchievement(studentId: string, achievementId: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase
      .from("student_achievements")
      .delete()
      .eq("student_id", studentId)
      .eq("achievement_id", achievementId);
    if (error) throw error;
    revalidatePath("/admin/students");
    revalidatePath("/achievements");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to revoke achievement" };
  }
}
