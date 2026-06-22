import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

config({ path: ".env.local" });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTeamsTable() {
  const { error } = await supabase.from("teams").select("id").limit(1);
  return !error;
}

async function main() {
  console.log("Waiting for 'teams' table and schema migration to be successfully completed in Supabase...");
  const maxAttempts = 60; // 10 minutes max
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const exists = await checkTeamsTable();
    if (exists) {
      try {
        // Try running the seed script. If the database schema isn't fully updated, this might throw.
        execSync("npx.cmd tsx scripts/seed.ts", { stdio: "ignore" });
        console.log("\n\n🎉 Database successfully bootstrapped and seeded!");
        process.exit(0);
      } catch (err) {
        // Seed failed, database schema might not be fully updated yet.
      }
    }
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 10000)); // wait 10s
  }
  console.log("\n❌ Timeout waiting for database migration.");
  process.exit(1);
}

main();
