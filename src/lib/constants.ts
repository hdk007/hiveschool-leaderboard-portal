import type { AnnouncementPriority, ChallengeStatus } from "@/types/database";

export const SITE = {
  name: "HiveSchool",
  product: "Leaderboard Portal",
  tagline: "Track. Compete. Grow.",
  description:
    "Track student growth, rankings, achievements, and curriculum progress in one premium dashboard.",
};

/** Public navigation (no auth required). */
export const PUBLIC_NAV = [
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Teams", href: "/teams" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Challenges", href: "/challenges" },
  { label: "Achievements", href: "/achievements" },
  { label: "Announcements", href: "/announcements" },
];

/** Admin sidebar navigation. */
export const ADMIN_NAV = [
  { label: "Overview", href: "/admin", icon: "LayoutDashboard" },
  { label: "Students", href: "/admin/students", icon: "Users" },
  { label: "Teams", href: "/admin/teams", icon: "ShieldCheck" },
  { label: "Leaderboard", href: "/admin/leaderboard", icon: "Trophy" },
  { label: "Curriculum", href: "/admin/curriculum", icon: "BookOpen" },
  { label: "Challenges", href: "/admin/challenges", icon: "Swords" },
  { label: "Announcements", href: "/admin/announcements", icon: "Megaphone" },
  { label: "Achievements", href: "/admin/achievements", icon: "Award" },
  { label: "Analytics", href: "/admin/analytics", icon: "LineChart" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
  { label: "Activity Logs", href: "/admin/activity", icon: "ScrollText" },
] as const;

export const PRIORITY_STYLES: Record<
  AnnouncementPriority,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  high: { label: "High", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
};

export const CHALLENGE_STATUS_STYLES: Record<
  ChallengeStatus,
  { label: string; className: string }
> = {
  upcoming: { label: "Upcoming", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
};

/** Default page size for the leaderboard table. */
export const PAGE_SIZE = 10;

/** Chart palette aligned to the design system. */
export const CHART_COLORS = {
  primary: "#0F172A",
  accent: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  sky: "#0EA5E9",
  pink: "#EC4899",
  indigo: "#6366F1",
};
