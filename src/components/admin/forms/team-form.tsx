"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { createTeam, updateTeam } from "@/app/actions/teams";
import type { TeamInput } from "@/lib/validators";
import type { Team } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  onSaved?: () => void;
}

const EMPTY: TeamInput = {
  name: "",
  team_logo: "",
  captain_name: "",
  description: "",
};

export function TeamForm({ open, onOpenChange, team, onSaved }: Props) {
  const [form, setForm] = React.useState<TeamInput>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(team);

  React.useEffect(() => {
    if (open) {
      setForm(
        team
          ? {
              name: team.name,
              team_logo: team.team_logo ?? "",
              captain_name: team.captain_name ?? "",
              description: team.description ?? "",
            }
          : EMPTY
      );
    }
  }, [open, team]);

  const set = <K extends keyof TeamInput>(key: K, value: TeamInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = isEdit ? await updateTeam(team!.id, form) : await createTeam(form);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Team updated" : "Team created");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Team" : "Add Team"}</DialogTitle>
        <DialogDescription>
          Teams are comprised of students. Scores and metrics are aggregated from individual student performance.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-4">
        <ImageUpload value={form.team_logo ?? null} onChange={(url) => set("team_logo", url ?? "")} />

        <Field label="Team Name" required>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>

        <Field label="Captain Name">
          <Input value={form.captain_name ?? ""} onChange={(e) => set("captain_name", e.target.value)} />
        </Field>

        <Field label="Description">
          <Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Brief description of the team..." rows={3} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create team"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
