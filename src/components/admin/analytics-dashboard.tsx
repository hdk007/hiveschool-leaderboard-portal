"use client";

import * as React from "react";
import { Users, Award, CalendarCheck, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { AreaTrendChart, MultiLineChart, SimpleBarChart, DonutChart } from "@/components/charts/charts";
import { CHART_COLORS } from "@/lib/constants";
import type { PlatformStats } from "@/lib/queries";

interface TrendPoint { date: string; projectScore: number; attendance: number; score: number }

interface Props {
  stats: PlatformStats;
  trend: TrendPoint[];
  projectScoreByTeam: { team: string; score: number }[];
  challengeParticipation: { title: string; participants: number }[];
  batchDistribution: { name: string; value: number; color: string }[];
  completionRate: number;
}

export function AnalyticsDashboard({ stats, trend, projectScoreByTeam, challengeParticipation, batchDistribution, completionRate }: Props) {
  const [range, setRange] = React.useState("all");

  const filteredTrend = React.useMemo(() => {
    if (range === "all") return trend;
    const n = Number(range);
    return trend.slice(-n);
  }, [trend, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Live insights across performance, attendance, and engagement.</p>
        </div>
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="sm:w-44">
          <option value="all">All time</option>
          <option value="4">Last 4 snapshots</option>
          <option value="8">Last 8 snapshots</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard index={0} label="Avg Project Score" value={stats.avgProjectScore} icon={Award} accent="#F59E0B" format="decimal" />
        <StatCard index={1} label="Active Students" value={stats.activeStudents} icon={Users} accent="#10B981" />
        <StatCard index={2} label="Avg Attendance" value={stats.avgAttendance} icon={CalendarCheck} accent="#0EA5E9" format="percent1" />
        <StatCard index={3} label="Assignment Rate" value={completionRate} icon={Trophy} accent="#7C3AED" format="percent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Score Trends</CardTitle>
            <CardDescription>Average project score across recorded snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTrend.length > 1 ? (
              <AreaTrendChart data={filteredTrend} xKey="date" dataKey="projectScore" color={CHART_COLORS.warning} valueFormatter={(v) => v.toFixed(1)} />
            ) : <Empty />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance & Score</CardTitle>
            <CardDescription>Average attendance and leaderboard score over time.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTrend.length > 1 ? (
              <MultiLineChart
                data={filteredTrend}
                xKey="date"
                lines={[
                  { dataKey: "attendance", color: CHART_COLORS.sky, name: "Attendance %" },
                  { dataKey: "score", color: CHART_COLORS.accent, name: "Avg Score" },
                ]}
              />
            ) : <Empty />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Score by Team</CardTitle>
            <CardDescription>Which teams have the highest project scores.</CardDescription>
          </CardHeader>
          <CardContent>
            {projectScoreByTeam.length ? (
              <SimpleBarChart data={projectScoreByTeam} xKey="team" dataKey="score" color={CHART_COLORS.success} valueFormatter={(v) => v.toFixed(1)} />
            ) : <Empty />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Participation</CardTitle>
            <CardDescription>Students joined per challenge.</CardDescription>
          </CardHeader>
          <CardContent>
            {challengeParticipation.length ? (
              <SimpleBarChart data={challengeParticipation} xKey="title" dataKey="participants" color={CHART_COLORS.indigo} />
            ) : <Empty />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Students by Team</CardTitle>
            <CardDescription>Distribution of students across teams.</CardDescription>
          </CardHeader>
          <CardContent>
            {batchDistribution.length ? <DonutChart data={batchDistribution} /> : <Empty />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty() {
  return <p className="py-12 text-center text-sm text-muted-foreground">Not enough data yet. Capture a few snapshots to populate trends.</p>;
}
