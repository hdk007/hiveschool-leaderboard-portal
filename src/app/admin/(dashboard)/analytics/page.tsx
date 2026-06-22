import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getAllStudents, getAnalytics, getStats } from "@/lib/queries";
import { CHART_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const PALETTE = Object.values(CHART_COLORS);

export default async function AdminAnalyticsPage() {
  const [stats, analytics, students] = await Promise.all([getStats(), getAnalytics(), getAllStudents()]);

  // Students per team → donut data.
  const byTeam = new Map<string, number>();
  for (const s of students) {
    const teamName = s.teams?.name ?? "No Team";
    byTeam.set(teamName, (byTeam.get(teamName) ?? 0) + 1);
  }
  const batchDistribution = Array.from(byTeam.entries()).map(([name, value], i) => ({
    name,
    value,
    color: PALETTE[i % PALETTE.length],
  }));

  // Assignment completion rate (assume 40 assignments = 100%).
  const totalPossible = students.length * 40;
  const completionRate = totalPossible ? Math.min(100, (stats.assignmentsCompleted / totalPossible) * 100) : 0;

  return (
    <>
      <RealtimeRefresher tables={["students", "teams", "leaderboard_history", "team_challenge_scores"]} />
      <AnalyticsDashboard
        stats={stats}
        trend={analytics.trend}
        teamPoints={analytics.teamPoints}
        challengeParticipation={analytics.challengeParticipation}
        batchDistribution={batchDistribution}
        completionRate={completionRate}
      />
    </>
  );
}
