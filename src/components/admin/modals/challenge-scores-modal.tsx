"use client";

import * as React from "react";
import { Loader2, Trophy, Save } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveStudentChallengeScores } from "@/app/actions/challenges";
import type { DailyChallenge, Student } from "@/types/database";
import { toast } from "sonner";

interface Props {
  challenge: DailyChallenge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentScoreState {
  student_id: string;
  name: string;
  profile_image: string | null;
  score: number;
}

export function ChallengeScoresModal({ challenge, open, onOpenChange }: Props) {
  const [scores, setScores] = React.useState<StudentScoreState[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  React.useEffect(() => {
    if (!open || !challenge) return;

    const challengeId = challenge.id;

    async function load() {
      setLoading(true);
      try {
        // Fetch active students and any existing scores for this challenge
        const [studentsRes, scoresRes] = await Promise.all([
          supabase
            .from("students")
            .select("id, name, profile_image")
            .eq("status", "active")
            .order("name"),
          supabase
            .from("student_challenge_scores")
            .select("student_id, score")
            .eq("challenge_id", challengeId),
        ]);

        if (studentsRes.error) throw studentsRes.error;

        const students = (studentsRes.data ?? []) as Pick<Student, "id" | "name" | "profile_image">[];
        const existingScores = scoresRes.data ?? [];
        const scoreMap = new Map(existingScores.map((s) => [s.student_id, Number(s.score)]));

        const initialScores = students.map((s) => ({
          student_id: s.id,
          name: s.name,
          profile_image: s.profile_image,
          score: scoreMap.get(s.id) ?? 0,
        }));

        setScores(initialScores);
      } catch (err) {
        toast.error("Failed to load student challenge scores");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, challenge, supabase]);

  const updateScore = (studentId: string, val: number) => {
    setScores((current) =>
      current.map((s) => (s.student_id === studentId ? { ...s, score: isNaN(val) ? 0 : val } : s))
    );
  };

  const handleSave = async () => {
    if (!challenge) return;
    setSaving(true);
    const inputScores = scores.map((s) => ({
      student_id: s.student_id,
      score: s.score,
    }));
    const res = await saveStudentChallengeScores(challenge.id, inputScores);
    setSaving(false);
    if (res.ok) {
      toast.success("Scores updated successfully");
      onOpenChange(false);
    } else {
      toast.error(res.error ?? "Failed to save scores");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-warning" />
          Challenge Scores
        </DialogTitle>
        <DialogDescription>
          Grade each student for: <strong>{challenge?.title}</strong> ({challenge?.points} pts maximum).
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : scores.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No active students found. Add students in the Students tab first.
        </div>
      ) : (
        <div className="space-y-2 my-2 max-h-[320px] overflow-y-auto pr-1">
          {scores.map((s) => (
            <div key={s.student_id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar src={s.profile_image} name={s.name} size={28} />
                <Label className="font-medium truncate">{s.name}</Label>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="number"
                  min={0}
                  max={challenge?.points}
                  value={s.score}
                  onChange={(e) => updateScore(s.student_id, Number(e.target.value))}
                  className="w-24 text-right"
                />
                <span className="text-xs text-muted-foreground w-16">/ {challenge?.points} pts</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading || saving} variant="accent">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Scores
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
