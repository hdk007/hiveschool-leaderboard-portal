import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("\n✖ Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n🧹 Cleaning all data from Supabase (except admin accounts & settings)...");

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
    process.stdout.write(`  • Clearing table ${t} … `);
    const { error } = await supabase.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.log("FAILED");
      console.error(`✖ Failed to clear ${t}:`, error.message);
    } else {
      console.log("done");
    }
  }

  // Ensure there is at least one default settings row if none exists
  process.stdout.write("  • Initializing leaderboard settings … ");
  const { data: settings } = await supabase.from("leaderboard_settings").select("id").limit(1);
  if (!settings || settings.length === 0) {
    const { error } = await supabase.from("leaderboard_settings").insert({
      revenue_weight: 0.4,
      assignment_weight: 0.25,
      attendance_weight: 0.2,
      challenge_weight: 0.15,
    });
    if (error) {
      console.log("FAILED");
      console.error("✖ Failed to seed leaderboard settings:", error.message);
    } else {
      console.log("created");
    }
  } else {
    console.log("already present");
  }

  // Recalculate
  console.log("\n📊 Recalculating leaderboard...");
  const { error: recalcError } = await supabase.rpc("recalculate_leaderboard");
  if (recalcError) {
    console.warn("⚠️ Recalculating leaderboard returned:", recalcError.message);
  } else {
    console.log("✅ Leaderboard recalculated.");
  }

  console.log("\n✅ All demo data deleted successfully. The platform is ready for manual entries!");
}

main().catch((err) => {
  console.error("\n✖ Execution failed:\n", err);
  process.exit(1);
});
