import { AchievementsManager } from "@/components/admin/managers/achievements-manager";
import { getAchievementAwardCounts, getAchievements } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  const [achievements, counts] = await Promise.all([getAchievements(), getAchievementAwardCounts()]);
  return <AchievementsManager initial={achievements} counts={counts} />;
}
