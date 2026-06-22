"use client";

import * as React from "react";
import { Loader2, Save, CalendarRange } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateCampInfo } from "@/app/actions/curriculum";
import type { CampInfo } from "@/types/database";
import { toast } from "sonner";

const linesToArray = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export function CampInfoEditor({ initial }: { initial: CampInfo | null }) {
  const [form, setForm] = React.useState({
    name: initial?.name ?? "BuildCamp",
    subtitle: initial?.subtitle ?? "",
    location: initial?.location ?? "",
    date_range: initial?.date_range ?? "",
    whenText: (initial?.when_to_come ?? []).join("\n"),
    bringText: (initial?.what_to_bring ?? []).join("\n"),
  });
  const [saving, setSaving] = React.useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    const res = await updateCampInfo({
      name: form.name,
      subtitle: form.subtitle,
      location: form.location,
      date_range: form.date_range,
      when_to_come: linesToArray(form.whenText),
      what_to_bring: linesToArray(form.bringText),
    });
    setSaving(false);
    if (res.ok) toast.success("Camp info saved — pushed live."); else toast.error(res.error ?? "Failed to save");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarRange className="size-5 text-accent" /> Program Header</CardTitle>
        <CardDescription>The hero, dates and logistics shown at the top of the public curriculum page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Date range</Label>
            <Input placeholder="e.g. 23–27 June 2026" value={form.date_range} onChange={(e) => set("date_range", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input placeholder="e.g. HiveSchool Campus" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Subtitle</Label>
            <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>When to come <span className="text-xs text-muted-foreground">(one per line)</span></Label>
            <Textarea rows={3} value={form.whenText} onChange={(e) => set("whenText", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>What to bring <span className="text-xs text-muted-foreground">(one per line)</span></Label>
            <Textarea rows={3} value={form.bringText} onChange={(e) => set("bringText", e.target.value)} />
          </div>
        </div>
        <Button variant="accent" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save program header
        </Button>
      </CardContent>
    </Card>
  );
}
