"use client";

import * as React from "react";
import { Loader2, Save, RotateCcw, Camera } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { RankBadge } from "@/components/shared/rank-badge";
import { updateSettings, snapshotLeaderboard } from "@/app/actions/settings";
import { computeLeaderboard, DEFAULT_WEIGHTS } from "@/lib/ranking";
import { cn } from "@/lib/utils";
import type { LeaderboardSettings, Student } from "@/types/database";
import { toast } from "sonner";

const FIELDS = [
  { key: "assignment_weight", label: "Assignments Completed", color: "#6366F1" },
  { key: "attendance_weight", label: "Attendance", color: "#0EA5E9" },
] as const;

type WeightKey = (typeof FIELDS)[number]["key"];

export function SettingsForm({ settings, students }: { settings: LeaderboardSettings | null; students: Student[] }) {
  // Stored as integer percentages in the UI for friendlier editing.
  const initial = {
    assignment_weight: Math.round((settings?.assignment_weight ?? DEFAULT_WEIGHTS.assignment_weight) * 100),
    attendance_weight: Math.round((settings?.attendance_weight ?? DEFAULT_WEIGHTS.attendance_weight) * 100),
  };

  const [weights, setWeights] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [snapshotting, setSnapshotting] = React.useState(false);

  const sum = FIELDS.reduce((acc, f) => acc + weights[f.key], 0);
  const valid = sum === 100;

  // Keep the two weights complementary so they always total 100%.
  const set = (key: WeightKey, value: number) =>
    setWeights(() =>
      key === "assignment_weight"
        ? { assignment_weight: value, attendance_weight: 100 - value }
        : { attendance_weight: value, assignment_weight: 100 - value }
    );
  const reset = () => setWeights({ assignment_weight: 60, attendance_weight: 40 });

  // Live preview of the new ranking with the in-progress weights.
  const preview = React.useMemo(
    () =>
      computeLeaderboard(students, {
        assignment_weight: weights.assignment_weight / 100,
        attendance_weight: weights.attendance_weight / 100,
      }).slice(0, 5),
    [students, weights]
  );

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const res = await updateSettings({
      assignment_weight: weights.assignment_weight / 100,
      attendance_weight: weights.attendance_weight / 100,
    });
    setSaving(false);
    if (res.ok) toast.success("Weights saved — leaderboard recalculated live.");
    else toast.error(res.error ?? "Failed to save");
  };

  const snapshot = async () => {
    setSnapshotting(true);
    const res = await snapshotLeaderboard();
    setSnapshotting(false);
    if (res.ok) toast.success("Snapshot captured for analytics.");
    else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure how a student&apos;s score is calculated.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Score Weights</CardTitle>
            <CardDescription>
              A student&apos;s score blends assignments and attendance (each normalised to 0–100); the two weights must total 100%.
              Daily challenges are scored at the team level and don&apos;t affect individual scores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                    {f.label}
                  </Label>
                  <span className="text-sm font-semibold tabular">{weights[f.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={weights[f.key]}
                  onChange={(e) => set(f.key, Number(e.target.value))}
                  className="w-full accent-accent"
                  style={{ accentColor: f.color }}
                />
              </div>
            ))}

            <div className={cn("flex items-center justify-between rounded-lg border px-4 py-3 text-sm", valid ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5")}>
              <span className="font-medium">Total</span>
              <span className={cn("font-bold tabular", valid ? "text-success" : "text-destructive")}>
                {sum}% {valid ? "✓" : "— must equal 100%"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="accent" onClick={save} disabled={!valid || saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save weights
              </Button>
              <Button variant="outline" onClick={reset} disabled={saving}>
                <RotateCcw className="size-4" /> Reset to default
              </Button>
              <Button variant="outline" onClick={snapshot} disabled={snapshotting}>
                {snapshotting ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                Snapshot now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>How the top 5 students would rank with the selected weights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {preview.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No students to preview.</p>
            ) : (
              preview.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                  <RankBadge rank={s.computed_rank} className="size-7 text-xs" />
                  <Avatar src={s.profile_image} name={s.name} size={32} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</p>
                  <span className="text-sm font-semibold tabular">{s.computed_score.toFixed(1)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
