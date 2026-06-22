"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { createStudent, updateStudent } from "@/app/actions/students";
import type { StudentInput } from "@/lib/validators";
import type { Student, Team } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: (Student & { teams: { name: string } | null }) | null;
  teams: Team[];
  onSaved?: () => void;
}

const EMPTY: StudentInput = {
  name: "",
  email: "",
  phone: "",
  profile_image: "",
  team_id: "",
  attendance_percentage: 0,
  assignments_completed: 0,
  batch: "",
  status: "active",
  notes: "",
};

export function StudentForm({ open, onOpenChange, student, teams, onSaved }: Props) {
  const [form, setForm] = React.useState<StudentInput>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(student);

  // Initialise only when the dialog OPENS (or the edited student changes); not on
  // `teams` changes, so a live team update can't wipe in-progress input.
  React.useEffect(() => {
    if (open) {
      setForm(
        student
          ? {
              name: student.name,
              email: student.email,
              phone: student.phone ?? "",
              profile_image: student.profile_image ?? "",
              team_id: student.team_id ?? "",
              attendance_percentage: Number(student.attendance_percentage),
              assignments_completed: Number(student.assignments_completed),
              batch: student.batch ?? "",
              status: student.status,
              notes: student.notes ?? "",
            }
          : { ...EMPTY, team_id: teams[0]?.id ?? "" }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  const set = <K extends keyof StudentInput>(key: K, value: StudentInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = isEdit ? await updateStudent(student!.id, form) : await createStudent(form);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Student updated" : "Student added");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        <DialogDescription>
          Scores recalculate automatically and push live to every connected device.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="space-y-4">
        <ImageUpload value={form.profile_image ?? null} onChange={(url) => set("profile_image", url ?? "")} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </Field>
          <Field label="Phone">
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Team" required>
            <Select value={form.team_id ?? ""} onChange={(e) => set("team_id", e.target.value)} required>
              <option value="" disabled>Select a team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Attendance %">
            <Input type="number" min={0} max={100} step="0.1" value={form.attendance_percentage} onChange={(e) => set("attendance_percentage", Number(e.target.value))} />
          </Field>
          <Field label="Assignments Completed">
            <Input type="number" min={0} step={1} value={form.assignments_completed ?? 0} onChange={(e) => set("assignments_completed", Number(e.target.value))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value as "active" | "inactive")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Batch / Cohort">
            <Input value={form.batch ?? ""} placeholder="e.g. Cohort 5" onChange={(e) => set("batch", e.target.value)} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
        </Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add student"}
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
