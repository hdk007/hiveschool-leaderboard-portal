"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createChallenge, updateChallenge } from "@/app/actions/challenges";
import type { ChallengeInput } from "@/lib/validators";
import type { DailyChallenge } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge?: DailyChallenge | null;
  onSaved?: () => void;
}

const EMPTY: ChallengeInput = { title: "", description: "", points: 100, deadline: "", status: "upcoming", leaderboard_impact: "" };

/** Convert an ISO timestamp to the value a <input type="datetime-local"> expects. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function ChallengeForm({ open, onOpenChange, challenge, onSaved }: Props) {
  const [form, setForm] = React.useState<ChallengeInput>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(challenge);

  React.useEffect(() => {
    if (open) {
      setForm(
        challenge
          ? {
              title: challenge.title,
              description: challenge.description ?? "",
              points: challenge.points,
              deadline: toLocalInput(challenge.deadline),
              status: challenge.status,
              leaderboard_impact: challenge.leaderboard_impact ?? "",
            }
          : EMPTY
      );
    }
  }, [open, challenge]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = isEdit ? await updateChallenge(challenge!.id, form) : await createChallenge(form);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Challenge updated" : "Challenge created");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Challenge" : "New Challenge"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title <span className="text-destructive">*</span></Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Points</Label>
            <Input type="number" min={0} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ChallengeInput["status"] }))}>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Deadline</Label>
          <Input type="datetime-local" value={form.deadline ?? ""} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Leaderboard Impact</Label>
          <Input placeholder="e.g. Up to +50 points" value={form.leaderboard_impact ?? ""} onChange={(e) => setForm((f) => ({ ...f, leaderboard_impact: e.target.value }))} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
