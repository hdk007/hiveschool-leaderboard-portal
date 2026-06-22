"use client";

import * as React from "react";
import { TrendingUp, Award, ClipboardCheck, CalendarCheck, Trophy, Users } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RankChange } from "@/components/shared/rank-badge";
import { AreaTrendChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatNumber, formatCurrency } from "@/lib/utils";
import type { Team, Student, LeaderboardHistory } from "@/types/database";

interface Props {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamProfileModal({ team, open, onOpenChange }: Props) {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [history, setHistory] = React.useState<LeaderboardHistory[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !team) return;
    let active = true;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    Promise.all([
      supabase.from("students").select("*").eq("team_id", team.id).order("name", { ascending: true }),
      supabase.from("leaderboard_history").select("*").eq("team_id", team.id).order("snapshot_at", { ascending: true }),
    ]).then(([s, h]) => {
      if (!active) return;
      setStudents((s.data ?? []) as Student[]);
      setHistory((h.data ?? []) as LeaderboardHistory[]);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open, team]);

  if (!team) return null;

  // Calculate team stats dynamically from students list
  const activeStudents = students.filter((s) => s.status === "active");
  const totalRevenue = activeStudents.reduce((sum, s) => sum + Number(s.revenue_generated), 0);
  const avgRevenue = activeStudents.length > 0 ? totalRevenue / activeStudents.length : 0;
  const totalAssignments = activeStudents.reduce((sum, s) => sum + s.assignments_completed, 0);
  const avgAttendance = activeStudents.length > 0
    ? activeStudents.reduce((sum, s) => sum + Number(s.attendance_percentage), 0) / activeStudents.length
    : 0;
  const totalChallenges = activeStudents.reduce((sum, s) => sum + Number(s.challenge_score), 0);

  const projectTrend = history.map((h) => ({
    date: formatDate(h.snapshot_at, { month: "short", day: "numeric" }),
    project: Number(h.avg_revenue),
  }));

  const weeklyGrowth = Number(team.growth_percentage);
  const monthlyGrowth =
    history.length >= 5
      ? Math.round(
          ((Number(history[history.length - 1].total_points) - Number(history[history.length - 5].total_points)) /
            Math.max(1, Number(history[history.length - 5].total_points))) *
            1000
        ) / 10
      : weeklyGrowth;

  const stats = [
    { label: "Avg Revenue", value: formatCurrency(avgRevenue), icon: Award, color: "#10B981" },
    { label: "Total Assignments", value: formatNumber(totalAssignments), icon: ClipboardCheck, color: "#6366F1" },
    { label: "Avg Attendance", value: `${avgAttendance.toFixed(0)}%`, icon: CalendarCheck, color: "#0EA5E9" },
    { label: "Total Challenges", value: formatNumber(totalChallenges), icon: Trophy, color: "#F59E0B" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="sr-only">{team.name} profile</DialogTitle>
      </DialogHeader>

      {/* Header */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Avatar src={team.team_logo} name={team.name} size={80} />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold">{team.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Captain: {team.captain_name || "None"}</p>
          {team.description && <p className="text-sm text-muted-foreground mt-2 max-w-md">{team.description}</p>}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge variant="outline">
              Team Rank #{team.rank ?? "—"} · {Number(team.total_points).toFixed(1)} pts
            </Badge>
            <RankChange rank={team.rank} previousRank={team.previous_rank} />
          </div>
        </div>
      </div>

      <Separator className="my-5" />

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-secondary/40 p-3">
            <span className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}1a`, color: s.color }}>
              <s.icon className="size-4" />
            </span>
            <p className="mt-2 text-base font-bold tabular">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Growth */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <GrowthCard label="Weekly Growth" value={weeklyGrowth} />
        <GrowthCard label="Monthly Growth" value={monthlyGrowth} />
      </div>

      {/* Students list */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold flex items-center gap-1.5">
          <Users className="size-4 text-muted-foreground" /> Student Members ({students.length})
        </p>
        {students.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 max-h-[160px] overflow-y-auto pr-1">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/20 p-2 text-sm">
                <Avatar src={s.profile_image} name={s.name} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-none">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">Rank: #{s.rank ?? "—"} · Score: {Number(s.final_score).toFixed(0)} pts</p>
                </div>
                <Badge variant={s.status === "active" ? "success" : "secondary"} className="text-[10px] px-1 py-0 height-auto">
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No students assigned to this team yet.</p>
        )}
      </div>

      {/* Performance timeline */}
      <div className="mt-6">
        <p className="mb-1 text-sm font-semibold">Average Revenue Timeline</p>
        {loading ? (
          <div className="h-[180px] animate-pulse rounded-xl bg-secondary" />
        ) : projectTrend.length > 1 ? (
          <AreaTrendChart data={projectTrend} xKey="date" dataKey="project" height={180} valueFormatter={(v) => `$${v.toFixed(0)}`} />
        ) : (
          <EmptyState icon={TrendingUp} title="Not enough history yet" description="Trends appear after snapshots are recorded." />
        )}
      </div>
    </Dialog>
  );
}

function GrowthCard({ label, value }: { label: string; value: number }) {
  const up = value >= 0;
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className={`text-xl font-bold tabular ${up ? "text-success" : "text-destructive"}`}>
          {up ? "+" : ""}
          {value.toFixed(1)}%
        </p>
        <TrendingUp className={`size-4 ${up ? "text-success" : "rotate-180 text-destructive"}`} />
      </div>
      <Progress value={Math.min(100, Math.abs(value))} className="mt-2" indicatorClassName={up ? "bg-success" : "bg-destructive"} />
    </div>
  );
}
