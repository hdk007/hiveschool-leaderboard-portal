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
  console.log("\n🧹 Deleting all students from HiveSchool Leaderboard Portal...");

  // Delete all students. The CASCADE in the database schema will automatically 
  // clean up child records in student_achievements, challenge_participants, and leaderboard_history.
  const { data, error } = await supabase
    .from("students")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000") // Matches all rows (UUID never all zeros)
    .select("id");

  if (error) {
    console.error("✖ Failed to delete students:", error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${data?.length ?? 0} students and all their associated records (history, participation, achievements).`);
  
  console.log("\n📊 Recalculating leaderboard...");
  const { error: recalcError } = await supabase.rpc("recalculate_leaderboard");
  if (recalcError) {
    console.warn("⚠️ Recalculating leaderboard returned:", recalcError.message);
  } else {
    console.log("✅ Leaderboard recalculated.");
  }
}

main().catch((err) => {
  console.error("\n✖ Execution failed:\n", err);
  process.exit(1);
});
