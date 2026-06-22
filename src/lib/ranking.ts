import type { LeaderboardSettings, Student } from "@/types/database";

/**
 * Client-side mirror of the SQL `recalculate_leaderboard()` engine.
 *
 * The database is the source of truth — triggers recompute scores/ranks on every
 * write. This TS implementation exists so the admin can *preview* the effect of
 * changing weights before saving, and so charts can show "what-if" scenarios
 * without a round-trip.
 *
 * A student's score blends assignments (normalised to the cohort max) and
 * attendance (already 0–100) by the configurable weights, which sum to 1.0.
 * Daily-challenge points are scored at the team level, not here.
 */

export const DEFAULT_WEIGHTS = {
  assignment_weight: 0.6,
  attendance_weight: 0.4,
} as const;

export type ScoreWeights = Pick<LeaderboardSettings, "assignment_weight" | "attendance_weight">;

export interface ScoredStudent extends Student {
  computed_score: number;
  computed_rank: number;
}

export function computeLeaderboard(
  students: Student[],
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoredStudent[] {
  if (students.length === 0) return [];

  const maxAssignments = Math.max(1, ...students.map((s) => Number(s.assignments_completed)));

  const scored = students.map((s) => {
    const score =
      weights.assignment_weight * ((Number(s.assignments_completed) / maxAssignments) * 100) +
      weights.attendance_weight * Number(s.attendance_percentage);
    return { ...s, computed_score: Math.round(score * 100) / 100 };
  });

  // Rank with ties sharing a rank (matches SQL rank()).
  scored.sort((a, b) => b.computed_score - a.computed_score);
  let lastScore = Number.POSITIVE_INFINITY;
  let lastRank = 0;
  return scored.map((s, i) => {
    const rank = s.computed_score === lastScore ? lastRank : i + 1;
    lastScore = s.computed_score;
    lastRank = rank;
    return { ...s, computed_rank: rank };
  });
}

export function weightsAreValid(weights: ScoreWeights) {
  const sum = weights.assignment_weight + weights.attendance_weight;
  return Math.abs(sum - 1) < 0.001;
}

/** The breakdown of a single student's score for the profile modal. */
export function scoreBreakdown(
  student: Student,
  maxima: { assignments: number },
  weights: ScoreWeights = DEFAULT_WEIGHTS
) {
  return [
    {
      label: "Assignments",
      weight: weights.assignment_weight,
      contribution:
        weights.assignment_weight * ((Number(student.assignments_completed) / Math.max(1, maxima.assignments)) * 100),
    },
    {
      label: "Attendance",
      weight: weights.attendance_weight,
      contribution: weights.attendance_weight * Number(student.attendance_percentage),
    },
  ];
}
