"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity, pushNotification, requireAdmin } from "@/lib/auth";
import { challengeSchema, type ChallengeInput } from "@/lib/validators";
import type { MutationResult } from "./students";

function revalidate() {
  revalidatePath("/challenges");
  revalidatePath("/admin/challenges");
}

function normalize(data: ChallengeInput) {
  return { ...data, deadline: data.deadline ? new Date(data.deadline).toISOString() : null };
}

export async function createChallenge(input: ChallengeInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = challengeSchema.parse(input);
    const supabase = await createClient();
    const { data: row, error } = await supabase.from("daily_challenges").insert(normalize(data)).select("id").single();
    if (error) throw error;
    await logActivity({ action: "created", entity_type: "challenge", entity_id: row.id, metadata: { title: data.title } });
    await pushNotification({ type: "challenge", title: `New challenge: ${data.title}`, message: data.description ?? undefined, link: "/challenges" });
    revalidate();
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create challenge" };
  }
}

export async function updateChallenge(id: string, input: ChallengeInput): Promise<MutationResult> {
  try {
    await requireAdmin();
    const data = challengeSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from("daily_challenges").update(normalize(data)).eq("id", id);
    if (error) throw error;
    await logActivity({ action: "updated", entity_type: "challenge", entity_id: id, metadata: { title: data.title } });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update challenge" };
  }
}

export async function deleteChallenge(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("daily_challenges").delete().eq("id", id);
    if (error) throw error;
    await logActivity({ action: "deleted", entity_type: "challenge", entity_id: id });
    revalidate();
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete challenge" };
  }
}

export interface TeamScoreInput {
  team_id: string;
  score: number;
}

/**
 * Save the daily-challenge points each team earned. Challenge scores now feed
 * the TEAM leaderboard (the DB trigger on team_challenge_scores recomputes the
 * standings). Only teams with score > 0 are stored.
 */
export async function saveTeamChallengeScores(challengeId: string, scores: TeamScoreInput[]): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const rows = scores
      .filter((s) => Number(s.score) > 0)
      .map((s) => ({
        challenge_id: challengeId,
        team_id: s.team_id,
        score: s.score,
      }));

    // Replace existing scores for this challenge.
    const { error: delErr } = await supabase
      .from("team_challenge_scores")
      .delete()
      .eq("challenge_id", challengeId);
    if (delErr) throw delErr;

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("team_challenge_scores").insert(rows);
      if (insErr) throw insErr;
    }

    await logActivity({ action: "graded", entity_type: "challenge", entity_id: challengeId, metadata: { count: rows.length } });
    revalidate();
    revalidatePath("/leaderboard");
    revalidatePath("/teams");
    revalidatePath("/");

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save challenge scores" };
  }
}
