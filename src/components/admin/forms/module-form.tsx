"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createModule, updateModule } from "@/app/actions/curriculum";
import type { ModuleInput } from "@/lib/validators";
import type { CurriculumModule, ResourceLink, ScheduleItem } from "@/types/database";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: CurriculumModule | null;
  nextOrder: number;
  onSaved?: () => void;
}

interface FormState {
  module_name: string;
  description: string;
  outcome: string;
  duration: string;
  order_index: number;
  completion_percentage: number;
  scheduleText: string;
  topicsText: string;
  assignmentsText: string;
  resourcesText: string;
}

const blank = (order: number): FormState => ({
  module_name: "",
  description: "",
  outcome: "",
  duration: "",
  order_index: order,
  completion_percentage: 0,
  scheduleText: "",
  topicsText: "",
  assignmentsText: "",
  resourcesText: "",
});

const linesToArray = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

function parseResources(text: string): ResourceLink[] {
  return linesToArray(text).map((line) => {
    const [label, url] = line.split("|").map((s) => s.trim());
    return { label: label ?? line, url: url ?? "#" };
  });
}

/** Each line is "time | title | detail". */
function parseSchedule(text: string): ScheduleItem[] {
  return linesToArray(text).map((line) => {
    const [time, title, detail] = line.split("|").map((s) => s.trim());
    return { time: time ?? "", title: title ?? "", detail: detail ?? "" };
  });
}

const scheduleToText = (schedule: ScheduleItem[]) =>
  (schedule ?? []).map((s) => [s.time, s.title, s.detail].filter(Boolean).join(" | ")).join("\n");

export function ModuleForm({ open, onOpenChange, module, nextOrder, onSaved }: Props) {
  const [form, setForm] = React.useState<FormState>(blank(nextOrder));
  const [saving, setSaving] = React.useState(false);
  const isEdit = Boolean(module);

  // Initialise the form only when the dialog OPENS (or the edited module changes).
  // Intentionally not depending on `nextOrder` — otherwise a live curriculum
  // update from the realtime subscription would wipe in-progress input.
  React.useEffect(() => {
    if (open) {
      setForm(
        module
          ? {
              module_name: module.module_name,
              description: module.description ?? "",
              outcome: module.outcome ?? "",
              duration: module.duration ?? "",
              order_index: module.order_index,
              completion_percentage: Number(module.completion_percentage),
              scheduleText: scheduleToText(module.schedule ?? []),
              topicsText: (module.topics ?? []).join("\n"),
              assignmentsText: (module.assignments ?? []).join("\n"),
              resourcesText: (module.resources ?? []).map((r) => `${r.label} | ${r.url}`).join("\n"),
            }
          : blank(nextOrder)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, module]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: ModuleInput = {
      module_name: form.module_name,
      description: form.description,
      outcome: form.outcome,
      duration: form.duration,
      order_index: form.order_index,
      completion_percentage: form.completion_percentage,
      schedule: parseSchedule(form.scheduleText),
      topics: linesToArray(form.topicsText),
      assignments: linesToArray(form.assignmentsText),
      resources: parseResources(form.resourcesText),
    };
    const res = isEdit ? await updateModule(module!.id, payload) : await createModule(payload);
    setSaving(false);
    if (res.ok) {
      toast.success(isEdit ? "Module updated" : "Module created");
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res.error ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Module" : "New Module"}</DialogTitle>
        <DialogDescription>Enter one topic / assignment per line. Resources use “Label | https://url”.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Module Name <span className="text-destructive">*</span></Label>
            <Input value={form.module_name} onChange={(e) => setForm((f) => ({ ...f, module_name: e.target.value }))} required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description (what you&apos;ll do)</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Outcome — &ldquo;you&apos;ll walk away with…&rdquo;</Label>
            <Input placeholder="e.g. a live MVP and a one page business model" value={form.outcome} onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Day / Duration</Label>
            <Input placeholder="e.g. Day 1 · Tue 23 Jun" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div className={isEdit ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 gap-4"}>
            {isEdit && (
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" min={0} value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) }))} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Completion %</Label>
              <Input type="number" min={0} max={100} value={form.completion_percentage} onChange={(e) => setForm((f) => ({ ...f, completion_percentage: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Schedule — one slot per line: <span className="font-mono text-xs">time | title | detail</span></Label>
          <Textarea
            rows={6}
            placeholder={"10:00 AM | Welcome & kickoff | Meet everyone and form your team\n12:30 PM | Lunch |"}
            value={form.scheduleText}
            onChange={(e) => setForm((f) => ({ ...f, scheduleText: e.target.value }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Topics</Label>
            <Textarea rows={5} placeholder={"One per line"} value={form.topicsText} onChange={(e) => setForm((f) => ({ ...f, topicsText: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Assignments</Label>
            <Textarea rows={5} placeholder={"One per line"} value={form.assignmentsText} onChange={(e) => setForm((f) => ({ ...f, assignmentsText: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Resources</Label>
            <Textarea rows={5} placeholder={"Workbook | https://…"} value={form.resourcesText} onChange={(e) => setForm((f) => ({ ...f, resourcesText: e.target.value }))} />
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
