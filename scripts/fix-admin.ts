/**
 * Fix Admin Access — inserts/updates the admin record in public.admins
 * without clearing any other data.
 *
 * Run with:  npx tsx scripts/fix-admin.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "hiveschool@admin.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Hive@adminlogin";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("\n✖ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n🔧 Fixing admin access...\n");

  // 1. Find or create the auth user
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let adminId = list?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())?.id;

  if (!adminId) {
    console.log(`  • Auth user not found — creating ${ADMIN_EMAIL}...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { role: "admin", full_name: "HiveSchool Admin" },
    });
    if (error) { console.error("  ✖ Failed:", error.message); process.exit(1); }
    adminId = data.user.id;
    console.log(`  ✔ Created auth user: ${adminId}`);
  } else {
    console.log(`  ✔ Found auth user: ${adminId}`);
    // Ensure password matches
    await supabase.auth.admin.updateUserById(adminId, { password: ADMIN_PASSWORD });
    console.log("  ✔ Password synced");
  }

  // 2. Upsert into public.admins
  const { error } = await supabase
    .from("admins")
    .upsert({ id: adminId, email: ADMIN_EMAIL, full_name: "HiveSchool Admin" });

  if (error) {
    console.error("  ✖ Failed to upsert admins row:", error.message);
    process.exit(1);
  }

  console.log("  ✔ public.admins row upserted");
  console.log("\n✅ Done!");
  console.log(`   Login: ${ADMIN_EMAIL}`);
  console.log(`   Pass:  ${ADMIN_PASSWORD}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n✖ Script failed:\n", err);
  process.exit(1);
});
