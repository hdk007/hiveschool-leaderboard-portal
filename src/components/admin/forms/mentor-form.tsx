"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { createMentor, updateMentor } from "@/app/actions/curriculum";
import type { MentorInput } from "@/lib/validators";
import type { Mentor } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor?: Mentor | null;
  onSaved?: () => void;
}

const EMPTY: MentorInput = { name: "", role: "", bio: "", photo: "", order_index: 0 };

export function MentorForm({ open, onOpenChange, mentor, onSaved }: Props) {
  const [form, setForm] = React.useState<MentorInput>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(mentor);

  React.useEffect(() => {
    if (open) {
      setForm(
        mentor
          ? {
              name: mentor.name,
              role: mentor.role ?? "",
              bio: mentor.bio ?? "",
              photo: mentor.photo ?? "",
              order_index: mentor.order_index,
            }
          : EMPTY
      );
    }
  }, [open, mentor]);

  const set = <K extends keyof MentorInput>(key: K, value: MentorInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = isEdit ? await updateMentor(mentor!.id, form) : await createMentor(form);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Mentor updated" : "Mentor added");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Mentor" : "Add Mentor"}</DialogTitle>
        <DialogDescription>Mentors appear on the public curriculum page.</DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-4">
        <ImageUpload value={form.photo ?? null} onChange={(url) => set("photo", url ?? "")} />

        <div className="space-y-1.5">
          <Label>Name <span className="text-destructive">*</span></Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Input placeholder="e.g. Founder, HiveSchool" value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Order</Label>
            <Input type="number" min={0} value={form.order_index} onChange={(e) => set("order_index", Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea rows={2} placeholder="A short line about them" value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add mentor"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
