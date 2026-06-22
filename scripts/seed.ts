/**
 * HiveSchool Leaderboard Portal — Database Bootstrap & Reset & Seed
 * -----------------------------------------------------------------------------
 * Clears all dynamic data (students, teams, challenges, announcements, history)
 * and bootstraps the admin account, default settings, and realistic demo data
 * for students, teams, achievements, challenges, and curriculum modules.
 *
 * Run with:  npm run seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

// Load environment variables
config({ path: ".env.local" });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "hive@admin.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "hiveportal@admin.login";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "\n✖ Missing env variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  process.stdout.write(`  • ${label} … `);
  try {
    const res = await fn();
    console.log("done");
    return res;
  } catch (err) {
    console.log("FAILED");
    throw err;
  }
}

// 1. Clear dynamic tables
async function clearData() {
  const tables = [
    "student_achievements",
    "student_challenge_scores",
    "leaderboard_history",
    "notifications",
    "activity_logs",
    "students",
    "achievements",
    "announcements",
    "daily_challenges",
    "curriculum_modules",
    "teams",
  ];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`clear ${t}: ${error.message}`);
  }
}

// 2. Admin account setup
async function seedAdmin() {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let adminId = list?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())?.id;

  if (!adminId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "admin", full_name: "HiveSchool Admin" },
    });
    if (error) throw error;
    adminId = data.user.id;
  } else {
    // Sync password
    await supabase.auth.admin.updateUserById(adminId, { password: ADMIN_PASSWORD });
  }

  const { error: upErr } = await supabase
    .from("admins")
    .upsert({ id: adminId, email: ADMIN_EMAIL, full_name: "HiveSchool Admin" });
  if (upErr) throw upErr;
}

// 3. Settings setup
async function seedSettings() {
  await supabase.from("leaderboard_settings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("leaderboard_settings").insert({
    revenue_weight: 0.4,
    assignment_weight: 0.25,
    attendance_weight: 0.2,
    challenge_weight: 0.15,
  });
  if (error) throw error;
}

// 4. Seeding Teams & Students & Achievements & Challenges
async function seedDemoData() {
  // A. Create 10 Teams
  const teamNames = [
    "Apex Predators",
    "Byte Wizards",
    "Code Crusaders",
    "Dev Dynamos",
    "Echo Builders",
    "Frontline Hackers",
    "Grid Guardians",
    "Hyper Scalers",
    "Infinite Loopers",
    "Just Compile",
  ];

  const teamsToInsert = teamNames.map((name) => ({
    name,
    team_logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    captain_name: faker.person.fullName(),
    description: `The elite developers forming team ${name}, dedicated to building premium products and dominating the bootcamp scoreboard.`,
    total_points: 0,
    total_students: 0,
    rank: null,
    previous_rank: null,
    growth_percentage: 0,
  }));

  const { data: seededTeams, error: teamsError } = await supabase
    .from("teams")
    .insert(teamsToInsert)
    .select("id, name");
  if (teamsError) throw teamsError;

  // B. Create 100 Students
  const studentsToInsert: any[] = [];
  const cohortName = "Full Stack Web Bootcamp - Cohort 5";

  for (let i = 0; i < 100; i++) {
    const team = seededTeams[i % seededTeams.length];
    const name = faker.person.fullName();
    const status = Math.random() > 0.08 ? "active" : "inactive";

    studentsToInsert.push({
      name,
      email: faker.internet.email({ firstName: name.split(" ")[0], lastName: name.split(" ")[1] }).toLowerCase(),
      phone: faker.phone.number(),
      profile_image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      team_id: team.id,
      attendance_percentage: status === "active" ? parseFloat(faker.number.float({ min: 65, max: 100, fractionDigits: 2 }).toFixed(2)) : 0,
      revenue_generated: status === "active" ? parseFloat(faker.number.float({ min: 0, max: 12000, fractionDigits: 2 }).toFixed(2)) : 0,
      assignments_completed: status === "active" ? faker.number.int({ min: 0, max: 24 }) : 0,
      challenge_score: 0, // calculated from challenge scores table
      final_score: 0,
      rank: null,
      previous_rank: null,
      growth_percentage: 0,
      batch: cohortName,
      status,
      notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
    });
  }

  const { data: seededStudents, error: studentsError } = await supabase
    .from("students")
    .insert(studentsToInsert)
    .select("id, name");
  if (studentsError) throw studentsError;

  // C. Create 6 Achievements (Badges)
  const achievements = [
    { title: "Revenue Pioneer", description: "Generated over $5,000 in customer mock sales/revenue.", icon: "Trophy", color: "#F59E0B", criteria: "revenue_generated >= 5000" },
    { title: "Code Warrior", description: "Successfully passed 20+ automated test assignment suites.", icon: "Code", color: "#3B82F6", criteria: "assignments_completed >= 20" },
    { title: "Attendance Master", description: "Maintained a perfect 95%+ attendance record in classroom live lectures.", icon: "Calendar", color: "#10B981", criteria: "attendance_percentage >= 95" },
    { title: "Perfect Submissions", description: "Completed all curriculum module checkpoints on time.", icon: "CheckSquare", color: "#7C3AED", criteria: "assignments_completed = 24" },
    { title: "Challenge Conqueror", description: "Scored high points on 2 or more daily code challenges.", icon: "Swords", color: "#EF4444", criteria: "challenge_score >= 250" },
    { title: "Growth Champion", description: "Climbed up the individual scoreboard rank indices.", icon: "TrendingUp", color: "#EC4899", criteria: "positive growth rate" },
  ];

  const { data: seededAchievements, error: achError } = await supabase
    .from("achievements")
    .insert(achievements)
    .select("id, title");
  if (achError) throw achError;

  // D. Create 4 Daily Challenges
  const challenges = [
    { title: "Optimize DB Query Complexity", description: "Refactor a nested PostgreSQL JSON aggregation query to optimize execution speed under 50ms.", points: 100, deadline: faker.date.future().toISOString(), status: "active", leaderboard_impact: "High impact on engineering scores" },
    { title: "Implement JWT Authentication Flow", description: "Set up JWT access & refresh token rotation middleware inside a secure client cookie exchange.", points: 150, deadline: faker.date.past().toISOString(), status: "completed", leaderboard_impact: "Normal challenge" },
    { title: "Create Responsive Dashboard Layout", description: "Design a beautiful dashboard using React + CSS variables supporting system level theme sync.", points: 100, deadline: faker.date.past().toISOString(), status: "completed", leaderboard_impact: "Normal challenge" },
    { title: "Build Custom State Management Hook", description: "Create a lightweight React global store hook mimicking Redux without using React Context API.", points: 200, deadline: faker.date.future().toISOString(), status: "upcoming", leaderboard_impact: "Legendary difficulty challenge" },
  ];

  const { data: seededChallenges, error: chalError } = await supabase
    .from("daily_challenges")
    .insert(challenges)
    .select("id, title, points, status");
  if (chalError) throw chalError;

  // E. Seed student challenge scores for COMPLETED challenges
  const completedChallenges = seededChallenges.filter((c) => c.status === "completed");
  const studentChallengeScoresToInsert: any[] = [];

  for (const c of completedChallenges) {
    // 70% of active students participated
    for (const student of seededStudents) {
      const is_active = studentsToInsert.find((s) => s.name === student.name)?.status === "active";
      if (is_active && Math.random() < 0.7) {
        studentChallengeScoresToInsert.push({
          challenge_id: c.id,
          student_id: student.id,
          score: faker.number.int({ min: 50, max: c.points }),
        });
      }
    }
  }

  if (studentChallengeScoresToInsert.length > 0) {
    const { error: scoreErr } = await supabase
      .from("student_challenge_scores")
      .insert(studentChallengeScoresToInsert);
    if (scoreErr) throw scoreErr;
  }

  // F. Seed random achievements unlocked (2-3 per student)
  const unlocksToInsert: any[] = [];
  for (const student of seededStudents) {
    if (Math.random() < 0.5) {
      // Award 1-2 random badges
      const shuffled = [...seededAchievements].sort(() => 0.5 - Math.random());
      unlocksToInsert.push({
        student_id: student.id,
        achievement_id: shuffled[0].id,
        awarded_at: faker.date.recent().toISOString(),
      });
      if (Math.random() < 0.3) {
        unlocksToInsert.push({
          student_id: student.id,
          achievement_id: shuffled[1].id,
          awarded_at: faker.date.recent().toISOString(),
        });
      }
    }
  }

  if (unlocksToInsert.length > 0) {
    const { error: unlockErr } = await supabase
      .from("student_achievements")
      .insert(unlocksToInsert);
    if (unlockErr) throw unlockErr;
  }

  // G. Seed Curriculum Modules
  const modules = [
    {
      module_name: "Module 1: Advanced Frontend & State Management",
      description: "Deep dive into building responsive frontend architectures using React, state management patterns, and CSS systems.",
      topics: ["React Hooks & Custom Effects", "Light & Dark Mode Contexts", "Framer Motion Animations", "Performance Profiling"],
      assignments: ["Build a premium SaaS dashboard UI", "Deploy landing page to Vercel/Netlify"],
      resources: [{ label: "React Documentation", url: "https://react.dev" }, { label: "CSS Layout Guide", url: "https://css-tricks.com" }],
      duration: "3 weeks",
      completion_percentage: 100,
      order_index: 0,
    },
    {
      module_name: "Module 2: Server-Side Apps & APIs",
      description: "Understanding hybrid server/client models, database fetching strategies, dynamic routing, and server actions.",
      topics: ["Next.js App Router Architecture", "Server Actions & Revalidation", "API Endpoint Routing", "SEO & Meta Tags Setup"],
      assignments: ["Create dynamic blog engine", "Implement file upload APIs"],
      resources: [{ label: "Next.js Docs", url: "https://nextjs.org/docs" }],
      duration: "3 weeks",
      completion_percentage: 85,
      order_index: 1,
    },
    {
      module_name: "Module 3: Database Architectures & Supabase",
      description: "Design efficient relational schemas, configure secure Row Level Security (RLS) policies, and listen to real-time events.",
      topics: ["PostgreSQL Schema Design", "RLS Policies & JWT Authentication", "Supabase Storage Buckets", "Supabase Realtime Subscriptions"],
      assignments: ["Database design project", "Real-time chat client dashboard"],
      resources: [{ label: "Supabase Documentation", url: "https://supabase.com/docs" }],
      duration: "2 weeks",
      completion_percentage: 40,
      order_index: 2,
    },
    {
      module_name: "Module 4: Deployment & Scaling",
      description: "Containerize web architectures, deploy to serverless edges, run continuous workflows, and configure custom domains.",
      topics: ["CI/CD Workflows with GitHub Actions", "Dockerizing Next.js Applications", "Caching & CDN Optimization", "Monitoring & Crash Reporting"],
      assignments: ["Docker build assignment", "Secure site ssl configuration"],
      resources: [{ label: "Docker Quickstart", url: "https://docs.docker.com" }],
      duration: "2 weeks",
      completion_percentage: 0,
      order_index: 3,
    },
  ];

  const { error: modError } = await supabase.from("curriculum_modules").insert(modules);
  if (modError) throw modError;

  // H. Seed 3 Announcements
  const announcements = [
    { title: "Welcome to HiveSchool Leaderboard Portal!", description: "Track your scores individually, watch your team standings climb, unlock achievement badges, and complete daily coding challenges to level up your engineering skills.", priority: "urgent", is_pinned: true },
    { title: "Mid-Term Project Submissions Due Friday", description: "Be sure to upload all your source codes, documentation, and live demo links inside the curriculum portal page by Friday 11:59 PM.", priority: "high", is_pinned: false },
    { title: "Weekly Cohort Sync and QA Session", description: "Join our core instructors this Thursday at 4 PM for a live coding review and career guidance session on Zoom.", priority: "normal", is_pinned: false },
  ];

  const { error: annError } = await supabase.from("announcements").insert(announcements);
  if (annError) throw annError;
}

async function main() {
  const isClean = process.argv.includes("--clean") || process.argv.includes("-c");
  
  if (isClean) {
    console.log("\n🐝 Bootstrapping HiveSchool Leaderboard Portal (Clean State)\n");
  } else {
    console.log("\n🐝 Bootstrapping HiveSchool Leaderboard Portal (Student-Centric State)\n");
  }

  await step("Clearing dynamic data", clearData);
  await step("Admin account bootstrap", seedAdmin);
  await step("Leaderboard settings bootstrap", seedSettings);
  
  if (!isClean) {
    await step("Seeding premium demo data (Teams, Students, Badges, Challenges, Modules)", seedDemoData);
  }

  // Recalculate
  try {
    await supabase.rpc("recalculate_leaderboard");
    console.log("  • Recalculate RPC executed successfully!");
  } catch (e: any) {
    console.log("  • (Note: Recalculate RPC failed or not yet applied in DB:", e?.message ?? e, ")");
  }

  console.log(`\n✅ Bootstrap ${isClean ? "clean " : ""}complete!`);
  console.log(`   Admin Login: ${ADMIN_EMAIL}`);
  console.log(`   Password:    ${ADMIN_PASSWORD}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✖ Bootstrap failed:\n", err);
  process.exit(1);
});
