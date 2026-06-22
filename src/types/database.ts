/**
 * Database types — hand-authored to mirror the Supabase schema in
 * /supabase/migrations. Keep in sync with the SQL, or regenerate with:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type StudentStatus = "active" | "inactive";
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type ChallengeStatus = "upcoming" | "active" | "completed";

export interface Team {
  id: string;
  name: string;
  team_logo: string | null;
  captain_name: string | null;
  description: string | null;
  total_points: number;
  /** Daily-challenge points earned by the team (subset of total_points). */
  challenge_points: number;
  total_students: number;
  rank: number | null;
  previous_rank: number | null;
  growth_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  team_id: string | null;
  attendance_percentage: number;
  assignments_completed: number;
  final_score: number;
  rank: number | null;
  previous_rank: number | null;
  growth_percentage: number;
  batch: string | null;
  notes: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardSettings {
  id: string;
  /** Student score weights — assignments + attendance sum to 1.0. */
  assignment_weight: number;
  attendance_weight: number;
  updated_at: string;
}

export interface ResourceLink {
  label: string;
  url: string;
}

/** A single time-slot in a day's schedule. */
export interface ScheduleItem {
  time: string;
  title: string;
  detail?: string;
}

export interface CurriculumModule {
  id: string;
  module_name: string;
  description: string | null;
  /** "You'll walk away with…" — the day's headline outcome. */
  outcome: string | null;
  /** The day's time-slot schedule. */
  schedule: ScheduleItem[];
  topics: string[];
  assignments: string[];
  resources: ResourceLink[];
  duration: string | null;
  completion_percentage: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CampInfo {
  id: string;
  name: string;
  subtitle: string | null;
  location: string | null;
  date_range: string | null;
  when_to_come: string[];
  what_to_bring: string[];
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string | null;
  points: number;
  deadline: string | null;
  status: ChallengeStatus;
  leaderboard_impact: string | null;
  created_at: string;
  updated_at: string;
}

export type WeeklyChallenge = DailyChallenge;

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  criteria: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  awarded_at: string;
}

export interface StudentChallengeScore {
  id: string;
  challenge_id: string;
  student_id: string;
  score: number;
  created_at: string;
}

/** Daily-challenge points awarded to a team. */
export interface TeamChallengeScore {
  id: string;
  challenge_id: string;
  team_id: string;
  score: number;
  created_at: string;
}

export type ChallengeParticipant = TeamChallengeScore;

export interface LeaderboardHistory {
  id: string;
  team_id: string;
  rank: number | null;
  previous_rank: number | null;
  total_points: number;
  total_students: number;
  avg_revenue: number;
  avg_attendance: number;
  snapshot_at: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  performed_by: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

/** A student joined with its unlocked achievement badges. */
export interface StudentWithAchievements extends Student {
  achievements?: Achievement[];
}
