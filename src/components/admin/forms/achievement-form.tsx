"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon, ACHIEVEMENT_ICON_NAMES } from "@/components/icon";
import { createAchievement, updateAchievement } from "@/app/actions/achievements";
import { cn } from "@/lib/utils";
import type { AchievementInput } from "@/lib/validators";
import type { Achievement } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement?: Achievement | null;
  onSaved?: () => void;
}

const EMPTY: AchievementInput = { title: "", description: "", icon: "Award", color: "#7C3AED", criteria: "" };
const COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#0EA5E9", "#EC4899", "#6366F1", "#14B8A6"];

export function AchievementForm({ open, onOpenChange, achievement, onSaved }: Props) {
  const [form, setForm] = React.useState<AchievementInput>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(achievement);

  React.useEffect(() => {
    if (open) {
      setForm(
        achievement
          ? {
              title: achievement.title,
              description: achievement.description ?? "",
              icon: achievement.icon,
              color: achievement.color,
              criteria: achievement.criteria ?? "",
            }
          : EMPTY
      );
    }
  }, [open, achievement]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = isEdit ? await updateAchievement(achievement!.id, form) : await createAchievement(form);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Badge updated" : "Badge created");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Badge" : "New Badge"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${form.color}1f`, color: form.color }}>
            <Icon name={form.icon} size={30} />
          </span>
          <div className="flex-1 space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label>Criteria</Label>
          <Input placeholder="e.g. Rank ≤ 3" value={form.criteria ?? ""} onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))} />
        </div>

        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="grid grid-cols-8 gap-2">
            {ACHIEVEMENT_ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setForm((f) => ({ ...f, icon: name }))}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                  form.icon === name ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-secondary"
                )}
                aria-label={name}
              >
                <Icon name={name} size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn("size-8 rounded-full ring-offset-2 transition-all", form.color === c && "ring-2 ring-foreground")}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
            <Input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-8 w-14 p-1" />
          </div>
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
