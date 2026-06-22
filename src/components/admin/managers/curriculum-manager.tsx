"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleForm } from "@/components/admin/forms/module-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteModule } from "@/app/actions/curriculum";
import type { CurriculumModule } from "@/types/database";
import { toast } from "sonner";

export function CurriculumManager({ initial }: { initial: CurriculumModule[] }) {
  const [items, setItems] = React.useState<CurriculumModule[]>(initial);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CurriculumModule | null>(null);
  const [deleting, setDeleting] = React.useState<CurriculumModule | null>(null);
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase.from("curriculum_modules").select("*").order("order_index", { ascending: true });
    if (data) setItems(data as CurriculumModule[]);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-curriculum")
      .on("postgres_changes", { event: "*", schema: "public", table: "curriculum_modules" }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, refetch]);

  const nextOrder = items.length ? Math.max(...items.map((m) => m.order_index)) + 1 : 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Curriculum</h1>
          <p className="text-muted-foreground">{items.length} modules · build and order the learning path.</p>
        </div>
        <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" /> New Module
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={BookOpen} title="No modules" description="Create your first curriculum module." />
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <Card key={m.id} className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
                {String(m.order_index).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{m.module_name}</h3>
                  {m.duration && <Badge variant="secondary" className="gap-1"><Clock className="size-3" /> {m.duration}</Badge>}
                </div>
                {m.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{m.description}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={m.completion_percentage} className="h-1.5 max-w-[220px]" />
                  <span className="text-xs text-muted-foreground tabular">{m.completion_percentage}%</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(m); setFormOpen(true); }}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => setDeleting(m)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ModuleForm open={formOpen} onOpenChange={setFormOpen} module={editing} nextOrder={nextOrder} onSaved={refetch} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.module_name}”?`}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteModule(deleting.id);
          if (res.ok) toast.success("Deleted"); else toast.error(res.error ?? "Failed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
