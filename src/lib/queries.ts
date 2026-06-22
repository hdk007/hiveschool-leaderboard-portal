import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Achievement,
  ActivityLog,
  Announcement,
  AppNotification,
  CurriculumModule,
  LeaderboardHistory,
  LeaderboardSettings,
  Student,
  StudentAchievement,
  WeeklyChallenge,
  DailyChallenge,
  Team,
} from "@/types/database";

/**
 * Server-side data access layer. Every public page renders from these (SSR),
 * and client components hydrate / live-update on top via Realtime + React Query.
 */

export interface LeaderboardQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof Student | string;
  ascending?: boolean;
  teamId?: string;
}

export async function getLeaderboard(params: LeaderboardQuery = {}) {
  const {
    search,
    page = 1,
    pageSize = 10,
    sortBy = "rank",
    ascending = true,
    teamId,
  } = params;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("students")
      .select("*, teams(name, team_logo)", { count: "exact" });

    if (search) query = query.ilike("name", `%${search}%`);
    if (teamId) query = query.eq("team_id", teamId);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order(sortBy as string, { ascending, nullsFirst: false })
      .range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      students: (data ?? []) as (Student & { teams: { name: string; team_logo: string | null } | null })[],
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    };
  } catch (err) {
    console.error("Error in getLeaderboard:", err);
    return {
      students: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }
}

export async function getAllStudents() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .select("*, teams(name)")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as (Student & { teams: { name: string } | null })[];
  } catch (err) {
    console.error("Error in getAllStudents:", err);
    return [];
  }
}

export async function getTeams() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("rank", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return (data ?? []) as Team[];
  } catch (err) {
    console.error("Error in getTeams:", err);
    return [];
  }
}

export async function getTopPerformers(limit = 5) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("students")
      .select("*, teams(name, team_logo)")
      .eq("status", "active")
      .order("rank", { ascending: true, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as (Student & { teams: { name: string; team_logo: string | null } | null })[];
  } catch (err) {
    console.error("Error in getTopPerformers:", err);
    return [];
  }
}

export async function getStudentById(id: string) {
  try {
    const supabase = await createClient();
    const { data: student, error } = await supabase.from("students").select("*, teams(*)").eq("id", id).single();
    if (error) throw error;

    const { data: links, error: linksError } = await supabase
      .from("student_achievements")
      .select("achievement_id, awarded_at, achievements(*)")
      .eq("student_id", id);
    if (linksError) throw linksError;

    let history: LeaderboardHistory[] = [];
    if (student.team_id) {
      const { data: hist, error: histError } = await supabase
        .from("leaderboard_history")
        .select("*")
        .eq("team_id", student.team_id)
        .order("snapshot_at", { ascending: true });
      if (histError) throw histError;
      history = (hist ?? []) as LeaderboardHistory[];
    }

    return {
      student: student as Student & { teams: { name: string } | null },
      achievements: (links ?? []).map((l) => l.achievements).filter(Boolean) as unknown as Achievement[],
      history,
    };
  } catch (err) {
    console.error("Error in getStudentById:", err);
    return {
      student: null,
      achievements: [],
      history: [],
    };
  }
}

export async function getTeamById(id: string) {
  try {
    const supabase = await createClient();
    const { data: team, error } = await supabase.from("teams").select("*").eq("id", id).single();
    if (error) throw error;

    const { data: students, error: studError } = await supabase
      .from("students")
      .select("*")
      .eq("team_id", id)
      .order("rank", { ascending: true, nullsFirst: false });
    if (studError) throw studError;

    const { data: history, error: histError } = await supabase
      .from("leaderboard_history")
      .select("*")
      .eq("team_id", id)
      .order("snapshot_at", { ascending: true });
    if (histError) throw histError;

    return {
      team: team as Team,
      students: (students ?? []) as Student[],
      history: (history ?? []) as LeaderboardHistory[],
    };
  } catch (err) {
    console.error("Error in getTeamById:", err);
    return {
      team: null,
      students: [],
      history: [],
    };
  }
}

export interface PlatformStats {
  totalStudents: number;
  activeStudents: number;
  totalTeams: number;
  avgProjectScore: number;
  assignmentsCompleted: number;
  avgAttendance: number;
  totalChallenges: number;
  totalAnnouncements: number;
  leaderboardUpdatedAt: string | null;
}

export async function getStats(): Promise<PlatformStats> {
  try {
    const supabase = await createClient();
    
    const [
      totalStudentsRes,
      activeStudentsRes,
      studentsDataRes,
      challengesRes,
      announcementsRes,
      teamsRes
    ] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("students").select("revenue_generated, assignments_completed, attendance_percentage, updated_at"),
      supabase.from("daily_challenges").select("id", { count: "exact", head: true }),
      supabase.from("announcements").select("id", { count: "exact", head: true }),
      supabase.from("teams").select("id", { count: "exact", head: true }),
    ]);

    const totalStudents = totalStudentsRes.count ?? 0;
    const activeStudents = activeStudentsRes.count ?? 0;
    const students = studentsDataRes.data ?? [];
    const challenges = challengesRes.count ?? 0;
    const announcements = announcementsRes.count ?? 0;
    const totalTeams = teamsRes.count ?? 0;

    const totalRevenue = students.reduce((sum, s) => sum + Number(s.revenue_generated), 0);
    const avgRevenue = students.length > 0 ? totalRevenue / students.length : 0;
    const assignmentsCompleted = students.reduce((sum, s) => sum + Number(s.assignments_completed), 0);
    const avgAttendance =
      students.length > 0 ? students.reduce((sum, s) => sum + Number(s.attendance_percentage), 0) / students.length : 0;
    const lastUpdated = students
      .map((s) => s.updated_at as string)
      .sort()
      .pop();

    return {
      totalStudents,
      activeStudents,
      totalTeams,
      avgProjectScore: Math.round(avgRevenue * 10) / 10,
      assignmentsCompleted,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
      totalChallenges: challenges,
      totalAnnouncements: announcements,
      leaderboardUpdatedAt: lastUpdated ?? null,
    };
  } catch (err) {
    console.error("Error in getStats:", err);
    return {
      totalStudents: 0,
      activeStudents: 0,
      totalTeams: 0,
      avgProjectScore: 0,
      assignmentsCompleted: 0,
      avgAttendance: 0,
      totalChallenges: 0,
      totalAnnouncements: 0,
      leaderboardUpdatedAt: null,
    };
  }
}

export async function getCurriculum() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("curriculum_modules")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as CurriculumModule[];
  } catch (err) {
    console.error("Error in getCurriculum:", err);
    return [];
  }
}

export async function getAnnouncements() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Announcement[];
  } catch (err) {
    console.error("Error in getAnnouncements:", err);
    return [];
  }
}

export async function getChallenges() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("daily_challenges")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DailyChallenge[];
  } catch (err) {
    console.error("Error in getChallenges:", err);
    return [];
  }
}

export async function getChallengeParticipantCounts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("student_challenge_scores").select("challenge_id");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const id = row.challenge_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  } catch (err) {
    console.error("Error in getChallengeParticipantCounts:", err);
    return {};
  }
}

export async function getAchievements() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("title", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Achievement[];
  } catch (err) {
    console.error("Error in getAchievements:", err);
    return [];
  }
}

export async function getAchievementAwardCounts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("student_achievements").select("achievement_id");
    if (error) throw error;
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const id = row.achievement_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  } catch (err) {
    console.error("Error in getAchievementAwardCounts:", err);
    return {};
  }
}

export async function getRecentAchievementUnlocks(limit = 12) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("student_achievements")
      .select("id, awarded_at, students(name, profile_image), achievements(title, icon, color)")
      .order("awarded_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("Error in getRecentAchievementUnlocks:", err);
    return [];
  }
}

export async function getSettings(): Promise<LeaderboardSettings | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leaderboard_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as LeaderboardSettings) ?? null;
  } catch (err) {
    console.error("Error in getSettings:", err);
    return null;
  }
}

export async function getActivityLogs(limit = 50) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as ActivityLog[];
  } catch (err) {
    console.error("Error in getActivityLogs:", err);
    return [];
  }
}

export async function getNotifications(limit = 20) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as AppNotification[];
  } catch (err) {
    console.error("Error in getNotifications:", err);
    return [];
  }
}

/** Aggregated history for analytics trend charts. */
export async function getAnalytics() {
  try {
    const supabase = await createClient();
    const { data: history, error: histError } = await supabase
      .from("leaderboard_history")
      .select("snapshot_at, total_points, avg_revenue, avg_attendance");
    if (histError) throw histError;

    // Bucket history by ISO week date for trend lines.
    const buckets = new Map<string, { projectScore: number; attendance: number; score: number; n: number }>();
    for (const row of history ?? []) {
      const key = new Date(row.snapshot_at as string).toISOString().slice(0, 10);
      const b = buckets.get(key) ?? { projectScore: 0, attendance: 0, score: 0, n: 0 };
      b.projectScore += Number(row.avg_revenue);
      b.attendance += Number(row.avg_attendance);
      b.score += Number(row.total_points);
      b.n += 1;
      buckets.set(key, b);
    }
    const trend = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, b]) => ({
        date,
        projectScore: Math.round((b.projectScore / b.n) * 10) / 10,
        attendance: Math.round((b.attendance / b.n) * 10) / 10,
        score: Math.round((b.score / b.n) * 10) / 10,
      }));

    // Project score (revenue) by team
    const { data: teams, error: teamsError } = await supabase.from("teams").select("name, total_points");
    if (teamsError) throw teamsError;

    const projectScoreByTeam = (teams ?? []).map((t) => ({
      team: t.name as string,
      score: Number(t.total_points),
    }));

    // Student distribution across teams
    const { data: studentTeamCounts, error: studError } = await supabase
      .from("students")
      .select("team_id, teams(name)");
    if (studError) throw studError;

    const countMap = new Map<string, number>();
    for (const s of studentTeamCounts ?? []) {
      const name = (s.teams as any)?.name ?? "No Team";
      countMap.set(name, (countMap.get(name) ?? 0) + 1);
    }
    const batchDistribution = Array.from(countMap.entries()).map(([name, value], i) => ({
      name,
      value,
      color: `hsl(var(--accent) / ${Math.max(0.3, 1 - i * 0.15)})`
    }));

    const { data: participation, error: partError } = await supabase
      .from("daily_challenges")
      .select("title, student_challenge_scores(count)");
    if (partError) throw partError;

    const challengeParticipation = (participation ?? []).map((c) => ({
      title: c.title as string,
      participants: ((c.student_challenge_scores as unknown as { count: number }[])?.[0]?.count) ?? 0,
    }));

    return { trend, projectScoreByTeam, challengeParticipation, batchDistribution };
  } catch (err) {
    console.error("Error in getAnalytics:", err);
    return {
      trend: [],
      projectScoreByTeam: [],
      challengeParticipation: [],
      batchDistribution: [],
    };
  }
}

export type AchievementLink = StudentAchievement;
