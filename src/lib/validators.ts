import { z } from "zod";

/** Zod schemas — shared by server actions (validation) and forms (typing). */

export const studentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  profile_image: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  team_id: z.string().optional().nullable(),
  attendance_percentage: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional().nullable(),
  revenue_generated: z.coerce.number().min(0).default(0),
  assignments_completed: z.coerce.number().int().min(0).default(0),
  challenge_score: z.coerce.number().min(0).default(0),
  batch: z.string().optional().nullable(),
});
export type StudentInput = z.infer<typeof studentSchema>;

export const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  team_logo: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),
  captain_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
export type TeamInput = z.infer<typeof teamSchema>;

export const moduleSchema = z.object({
  module_name: z.string().min(2, "Module name is required"),
  description: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  completion_percentage: z.coerce.number().min(0).max(100).default(0),
  order_index: z.coerce.number().int().min(0).default(0),
  topics: z.array(z.string()).default([]),
  assignments: z.array(z.string()).default([]),
  resources: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .default([]),
});
export type ModuleInput = z.infer<typeof moduleSchema>;

export const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  is_pinned: z.boolean().default(false),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const challengeSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  points: z.coerce.number().int().min(0).default(100),
  deadline: z.string().optional().nullable(),
  status: z.enum(["upcoming", "active", "completed"]).default("active"),
  leaderboard_impact: z.string().optional().nullable(),
});
export type ChallengeInput = z.infer<typeof challengeSchema>;

export const achievementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional().nullable(),
  icon: z.string().min(1).default("Award"),
  color: z.string().min(1).default("#7C3AED"),
  criteria: z.string().optional().nullable(),
});
export type AchievementInput = z.infer<typeof achievementSchema>;

export const settingsSchema = z
  .object({
    revenue_weight: z.coerce.number().min(0).max(1),
    assignment_weight: z.coerce.number().min(0).max(1),
    attendance_weight: z.coerce.number().min(0).max(1),
    challenge_weight: z.coerce.number().min(0).max(1),
  })
  .refine(
    (w) =>
      Math.abs(
        w.revenue_weight + w.assignment_weight + w.attendance_weight + w.challenge_weight - 1
      ) < 0.001,
    { message: "Weights must add up to 100%." }
  );
export type SettingsInput = z.infer<typeof settingsSchema>;

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
