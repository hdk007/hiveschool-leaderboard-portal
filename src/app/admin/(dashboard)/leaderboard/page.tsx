import { PageHeader } from "@/components/shared/page-header";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { LeaderboardActions } from "@/components/admin/leaderboard-actions";
import { Card, CardContent } from "@/components/ui/card";
import { getLeaderboard, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminLeaderboardPage() {
  const [{ students, total }, settings] = await Promise.all([
    getLeaderboard({ page: 1, pageSize: 10, sortBy: "rank", ascending: true }),
    getSettings(),
  ]);

  const weights = settings ?? { revenue_weight: 0.4, assignment_weight: 0.25, attendance_weight: 0.2, challenge_weight: 0.15 };

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" description="The live student rankings. Scores recompute automatically on every change.">
        <LeaderboardActions />
      </PageHeader>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
          <span className="font-medium text-muted-foreground">Current weights:</span>
          <span>Revenue <strong>{Math.round(Number(weights.revenue_weight) * 100)}%</strong></span>
          <span>Assignments <strong>{Math.round(Number(weights.assignment_weight) * 100)}%</strong></span>
          <span>Attendance <strong>{Math.round(Number(weights.attendance_weight) * 100)}%</strong></span>
          <span>Challenge <strong>{Math.round(Number(weights.challenge_weight) * 100)}%</strong></span>
        </CardContent>
      </Card>

      <LeaderboardTable initialStudents={students} initialTotal={total} pageSize={10} />
    </div>
  );
}
