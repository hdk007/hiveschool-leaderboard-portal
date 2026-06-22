"use client";

import * as React from "react";
import { Mail, Phone, TrendingUp, Award, ClipboardCheck, CalendarCheck, Trophy } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AchievementBadge } from "@/components/shared/achievement-badge";
import { RankChange } from "@/components/shared/rank-badge";
import { AreaTrendChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Achievement, LeaderboardHistory, Student, Team } from "@/types/database";

interface Props {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type StudentWithTeam = Student & { teams: Team | null };

export function StudentProfileModal({ studentId, open, onOpenChange }: Props) {
  const [student, setStudent] = React.useState<StudentWithTeam | null>(null);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [history, setHistory] = React.useState<LeaderboardHistory[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !studentId) return;
    let active = true;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    async function loadData() {
      try {
        const { data: studentData, error: sErr } = await supabase
          .from("students")
          .select("*, teams(*)")
          .eq("id", studentId)
          .single();

        if (sErr) throw sErr;
        if (!active) return;

        setStudent(studentData as StudentWithTeam);

        const historyQuery = studentData.team_id
          ? supabase.from("leaderboard_history").select("*").eq("team_id", studentData.team_id).order("snapshot_at", { ascending: true })
          : Promise.resolve({ data: [] });

        const [aRes, hRes] = await Promise.all([
          supabase.from("student_achievements").select("achievements(*)").eq("student_id", studentId),
          historyQuery,
        ]);

        if (!active) return;

        setAchievements((aRes.data ?? []).map((r) => r.achievements).filter(Boolean) as unknown as Achievement[]);
        setHistory((hRes.data ?? []) as LeaderboardHistory[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [open, studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!student) return null;

  const projectTrend = history.map((h) => ({
    date: formatDate(h.snapshot_at, { month: "short", day: "numeric" }),
    project: Number(h.total_points),
  }));

  const weeklyGrowth = student.growth_percentage ? Number(student.growth_percentage) : 0;
  
  // Calculate historical score growth if history is available
  const monthlyGrowth =
    history.length >= 5
      ? Math.round(
          ((Number(history[history.length - 1].total_points) - Number(history[history.length - 5].total_points)) /
            Math.max(1, Number(history[history.length - 5].total_points))) *
            1000
        ) / 10
      : weeklyGrowth;

  const stats = [
    { label: "Final Score", value: Number(student.final_score).toFixed(1), icon: Award, color: "#10B981" },
    { label: "Assignments", value: formatNumber(student.assignments_completed), icon: ClipboardCheck, color: "#6366F1" },
    { label: "Attendance", value: `${Number(student.attendance_percentage).toFixed(0)}%`, icon: CalendarCheck, color: "#0EA5E9" },
    { label: "Individual Rank", value: student.rank ? `#${student.rank}` : "—", icon: Trophy, color: "#F59E0B" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-2xl">
      <DialogHeader>
        <DialogTitle className="sr-only">{student.name} profile</DialogTitle>
      </DialogHeader>

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <span className="text-sm text-muted-foreground animate-pulse">Loading profile data…</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar src={student.profile_image} name={student.name} size={80} />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h2 className="text-xl font-bold">{student.name}</h2>
                <Badge variant={student.status === "active" ? "success" : "secondary"}>{student.status}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
                <span className="inline-flex items-center gap-1"><Mail className="size-3.5" /> {student.email}</span>
                {student.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {student.phone}</span>}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="accent">{student.teams?.name ?? "No Team"}</Badge>
                <Badge variant="outline">
                  Individual Rank #{student.rank ?? "—"} · {Number(student.final_score).toFixed(1)} pts
                </Badge>
                <RankChange rank={student.rank} previousRank={student.previous_rank} />
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

          {/* Performance bars */}
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
            <MetricBar label="Attendance" value={Number(student.attendance_percentage)} display={`${Number(student.attendance_percentage).toFixed(0)}%`} color="#0EA5E9" />
            <MetricBar
              label="Assignments completed"
              value={Math.min(100, (Number(student.assignments_completed) / 24) * 100)}
              display={`${formatNumber(student.assignments_completed)} / 24`}
              color="#6366F1"
            />
          </div>

          {/* Growth */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <GrowthCard label="Weekly Growth Status" value={weeklyGrowth} />
            <GrowthCard label="Team Points Growth" value={monthlyGrowth} />
          </div>

          {/* Achievements */}
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold">Achievements</p>
            {achievements.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {achievements.map((a) => (
                  <AchievementBadge key={a.id} achievement={a} size="md" showLabel />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No badges unlocked yet.</p>
            )}
          </div>

          {/* Performance timeline */}
          <div className="mt-6">
            <p className="mb-1 text-sm font-semibold">Team Points Timeline</p>
            {projectTrend.length > 1 ? (
              <AreaTrendChart data={projectTrend} xKey="date" dataKey="project" height={180} valueFormatter={(v) => v.toFixed(0)} />
            ) : (
              <EmptyState icon={TrendingUp} title="Not enough history yet" description="Trends appear after snapshots are recorded." />
            )}
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{student.notes}</p>
            </div>
          )}
        </>
      )}
    </Dialog>
  );
}

function MetricBar({ label, value, display, color }: { label: string; value: number; display: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular">{display}</span>
      </div>
      <Progress value={value} indicatorStyle={{ backgroundColor: color }} />
    </div>
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
