"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createAnnouncement, updateAnnouncement } from "@/app/actions/announcements";
import type { AnnouncementInput } from "@/lib/validators";
import type { Announcement } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
  onSaved?: () => void;
}

const EMPTY: AnnouncementInput = { title: "", description: "", priority: "normal", is_pinned: false };

export function AnnouncementForm({ open, onOpenChange, announcement, onSaved }: Props) {
  const [form, setForm] = React.useState<AnnouncementInput>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(announcement);

  React.useEffect(() => {
    if (open) {
      setForm(
        announcement
          ? {
              title: announcement.title,
              description: announcement.description ?? "",
              priority: announcement.priority,
              is_pinned: announcement.is_pinned,
            }
          : EMPTY
      );
    }
  }, [open, announcement]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = isEdit ? await updateAnnouncement(announcement!.id, form) : await createAnnouncement(form);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Announcement updated" : "Announcement posted");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Announcement" : "New Announcement"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title <span className="text-destructive">*</span></Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as AnnouncementInput["priority"] }))}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <div className="flex items-end gap-3 pb-2">
            <Switch checked={form.is_pinned} onCheckedChange={(c) => setForm((f) => ({ ...f, is_pinned: c }))} id="pinned" />
            <Label htmlFor="pinned">Pin to top</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Post"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
