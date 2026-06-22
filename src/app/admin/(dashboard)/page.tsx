import Link from "next/link";
import { Users, UserCheck, Award, ClipboardCheck, CalendarCheck, Swords, Megaphone, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { AreaTrendChart } from "@/components/charts/charts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { RankBadge } from "@/components/shared/rank-badge";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getActivityLogs, getAnalytics, getStats, getTopPerformers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [stats, logs, top, analytics] = await Promise.all([
    getStats(),
    getActivityLogs(15),
    getTopPerformers(5),
    getAnalytics(),
  ]);

  return (
    <div className="space-y-6">
      <RealtimeRefresher tables={["students", "teams", "daily_challenges", "announcements", "activity_logs"]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">A live snapshot of everything happening at HiveSchool.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Total Students" value={stats.totalStudents} icon="Users" accent="#7C3AED" />
        <StatCard index={1} label="Active Students" value={stats.activeStudents} icon="UserCheck" accent="#10B981" />
        <StatCard index={2} label="Avg Project Score" value={stats.avgProjectScore} icon="Award" accent="#F59E0B" format="decimal" />
        <StatCard index={3} label="Assignments" value={stats.assignmentsCompleted} icon="ClipboardCheck" accent="#6366F1" />
        <StatCard index={4} label="Avg Attendance" value={stats.avgAttendance} icon="CalendarCheck" accent="#0EA5E9" format="percent1" />
        <StatCard index={5} label="Challenges" value={stats.totalChallenges} icon="Swords" accent="#EC4899" />
        <StatCard index={6} label="Announcements" value={stats.totalAnnouncements} icon="Megaphone" accent="#EF4444" />
        <StatCard index={7} label="Active Rate" value={stats.totalStudents ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0} icon="UserCheck" accent="#14B8A6" format="percent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Score trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Score Trend</CardTitle>
            <CardDescription>Aggregated project score across recorded leaderboard snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.trend.length > 1 ? (
              <AreaTrendChart data={analytics.trend} xKey="date" dataKey="projectScore" valueFormatter={(v) => v.toFixed(1)} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Snapshots will appear here over time.</p>
            )}
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Top Students</CardTitle>
            <Link href="/admin/leaderboard" className="text-xs font-medium text-accent hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.length > 0 ? (
              top.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/60">
                  <RankBadge rank={t.rank} className="size-7 text-xs" />
                  <Avatar src={t.profile_image} name={t.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">Revenue: ${Number(t.revenue_generated).toFixed(0)}</p>
                  </div>
                  <span className="text-sm font-semibold tabular">{Number(t.final_score).toFixed(1)}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No students registered yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity feed + quick links */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Every admin action is logged here in real time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed initial={logs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { href: "/admin/students", label: "Manage Students" },
              { href: "/admin/teams", label: "Manage Teams" },
              { href: "/admin/leaderboard", label: "Leaderboard & Weights" },
              { href: "/admin/challenges", label: "Create a Challenge" },
              { href: "/admin/announcements", label: "Post an Announcement" },
              { href: "/admin/analytics", label: "View Analytics" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-accent/40 hover:bg-accent/5"
              >
                {l.label}
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
