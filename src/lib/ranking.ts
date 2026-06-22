import type { LeaderboardSettings, Student } from "@/types/database";

/**
 * Client-side mirror of the SQL `recalculate_leaderboard()` engine.
 *
 * The database is the source of truth — triggers recompute scores/ranks on every
 * write. This TS implementation exists so the admin can *preview* the effect of
 * changing weights before saving, and so charts can show "what-if" scenarios
 * without a round-trip.
 *
 * Metrics are normalised to 0–100 against the cohort maxima, then blended by the
 * configurable weights (which sum to 1.0).
 */

export const DEFAULT_WEIGHTS = {
  revenue_weight: 0.4,
  assignment_weight: 0.25,
  attendance_weight: 0.2,
  challenge_weight: 0.15,
} as const;

export interface ScoredStudent extends Student {
  computed_score: number;
  computed_rank: number;
}

export function computeLeaderboard(
  students: Student[],
  weights: Pick<
    LeaderboardSettings,
    "revenue_weight" | "assignment_weight" | "attendance_weight" | "challenge_weight"
  > = DEFAULT_WEIGHTS
): ScoredStudent[] {
  if (students.length === 0) return [];

  const maxRevenue = Math.max(1, ...students.map((s) => Number(s.revenue_generated)));
  const maxAssignments = Math.max(1, ...students.map((s) => Number(s.assignments_completed)));
  const maxChallenge = Math.max(1, ...students.map((s) => Number(s.challenge_score)));

  const scored = students.map((s) => {
    const score =
      weights.revenue_weight * ((Number(s.revenue_generated) / maxRevenue) * 100) +
      weights.assignment_weight * ((Number(s.assignments_completed) / maxAssignments) * 100) +
      weights.attendance_weight * Number(s.attendance_percentage) +
      weights.challenge_weight * ((Number(s.challenge_score) / maxChallenge) * 100);
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

export function weightsAreValid(weights: {
  revenue_weight: number;
  assignment_weight: number;
  attendance_weight: number;
  challenge_weight: number;
}) {
  const sum =
    weights.revenue_weight +
    weights.assignment_weight +
    weights.attendance_weight +
    weights.challenge_weight;
  return Math.abs(sum - 1) < 0.001;
}

/** The breakdown of a single student's score for the profile modal. */
export function scoreBreakdown(
  student: Student,
  maxima: { revenue: number; assignments: number; challenge: number },
  weights = DEFAULT_WEIGHTS
) {
  return [
    {
      label: "Revenue",
      weight: weights.revenue_weight,
      contribution: weights.revenue_weight * ((Number(student.revenue_generated) / Math.max(1, maxima.revenue)) * 100),
    },
    {
      label: "Assignments",
      weight: weights.assignment_weight,
      contribution: weights.assignment_weight * ((Number(student.assignments_completed) / Math.max(1, maxima.assignments)) * 100),
    },
    {
      label: "Attendance",
      weight: weights.attendance_weight,
      contribution: weights.attendance_weight * Number(student.attendance_percentage),
    },
    {
      label: "Challenge",
      weight: weights.challenge_weight,
      contribution: weights.challenge_weight * ((Number(student.challenge_score) / Math.max(1, maxima.challenge)) * 100),
    },
  ];
}
