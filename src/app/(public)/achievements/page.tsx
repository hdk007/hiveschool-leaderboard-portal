import type { Metadata } from "next";
import { Award } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AchievementBadge } from "@/components/shared/achievement-badge";
import { AchievementsGrid } from "@/components/achievements/achievements-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getAchievementAwardCounts, getAchievements, getRecentAchievementUnlocks } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Achievements",
  description: "Unlockable badges that celebrate milestones and excellence at HiveSchool.",
};

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const [achievements, counts, recent] = await Promise.all([
    getAchievements(),
    getAchievementAwardCounts(),
    getRecentAchievementUnlocks(10),
  ]);

  const merged = achievements.map((a) => ({ ...a, count: counts[a.id] ?? 0 }));

  return (
    <div className="container space-y-8 py-10">
      <RealtimeRefresher tables={["achievements", "student_achievements"]} />
      <PageHeader
        eyebrow="Recognition"
        title="Achievements"
        description="Badges celebrate the milestones that matter — project score, attendance, challenges and more."
      />

      {achievements.length === 0 ? (
        <EmptyState icon={Award} title="No achievements yet" description="Badges will appear here once created by an admin." />
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AchievementsGrid achievements={merged} />
          </div>

          {/* Recent unlocks feed */}
          <div>
            <h2 className="mb-4 text-lg font-semibold">Recent Unlocks</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No badges unlocked yet.</p>
            ) : (
              <Card className="divide-y divide-border">
                {recent.map((r) => {
                  const student = r.students as unknown as { name: string; profile_image: string | null };
                  const ach = r.achievements as unknown as { title: string; icon: string; color: string };
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-4">
                      <Avatar src={student?.profile_image} name={student?.name ?? "?"} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <span className="font-medium">{student?.name}</span> unlocked{" "}
                          <span className="font-medium">{ach?.title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{timeAgo(r.awarded_at as string)}</p>
                      </div>
                      {ach && <AchievementBadge achievement={ach} size="sm" />}
                    </div>
                  );
                })}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
