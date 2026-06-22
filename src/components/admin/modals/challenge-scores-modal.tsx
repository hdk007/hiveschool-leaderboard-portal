"use client";

import * as React from "react";
import { Loader2, Trophy, Save } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveTeamChallengeScores } from "@/app/actions/challenges";
import type { DailyChallenge } from "@/types/database";
import { toast } from "sonner";

interface Props {
  challenge: DailyChallenge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TeamScoreState {
  team_id: string;
  name: string;
  team_logo: string | null;
  score: number;
}

export function ChallengeScoresModal({ challenge, open, onOpenChange }: Props) {
  const [scores, setScores] = React.useState<TeamScoreState[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  React.useEffect(() => {
    if (!open || !challenge) return;

    const challengeId = challenge.id;

    async function load() {
      setLoading(true);
      try {
        // Fetch teams and any existing scores recorded for this challenge.
        const [teamsRes, scoresRes] = await Promise.all([
          supabase.from("teams").select("id, name, team_logo").order("name"),
          supabase.from("team_challenge_scores").select("team_id, score").eq("challenge_id", challengeId),
        ]);

        if (teamsRes.error) throw teamsRes.error;

        const teams = (teamsRes.data ?? []) as { id: string; name: string; team_logo: string | null }[];
        const scoreMap = new Map((scoresRes.data ?? []).map((s) => [s.team_id, Number(s.score)]));

        setScores(
          teams.map((t) => ({
            team_id: t.id,
            name: t.name,
            team_logo: t.team_logo,
            score: scoreMap.get(t.id) ?? 0,
          }))
        );
      } catch (err) {
        toast.error("Failed to load team challenge scores");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open, challenge, supabase]);

  const updateScore = (teamId: string, val: number) => {
    setScores((current) =>
      current.map((s) => (s.team_id === teamId ? { ...s, score: isNaN(val) ? 0 : val } : s))
    );
  };

  const handleSave = async () => {
    if (!challenge) return;
    setSaving(true);
    const res = await saveTeamChallengeScores(
      challenge.id,
      scores.map((s) => ({ team_id: s.team_id, score: s.score }))
    );
    setSaving(false);
    if (res.ok) {
      toast.success("Team scores updated successfully");
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
          Team Challenge Scores
        </DialogTitle>
        <DialogDescription>
          Award points to each team for: <strong>{challenge?.title}</strong> ({challenge?.points} pts maximum).
          Points are added to the team&apos;s leaderboard total.
        </DialogDescription>
      </DialogHeader>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-accent" />
        </div>
      ) : scores.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No teams found. Create teams in the Teams tab first.
        </div>
      ) : (
        <div className="my-2 max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {scores.map((s) => (
            <div key={s.team_id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/20 p-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar src={s.team_logo} name={s.name} size={28} />
                <Label className="truncate font-medium">{s.name}</Label>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={challenge?.points}
                  value={s.score}
                  onChange={(e) => updateScore(s.team_id, Number(e.target.value))}
                  className="w-20 text-right sm:w-24"
                />
                <span className="w-14 text-xs text-muted-foreground sm:w-16">/ {challenge?.points} pts</span>
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
