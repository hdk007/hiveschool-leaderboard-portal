"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AchievementBadge } from "@/components/shared/achievement-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AchievementForm } from "@/components/admin/forms/achievement-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteAchievement } from "@/app/actions/achievements";
import type { Achievement } from "@/types/database";
import { toast } from "sonner";

export function AchievementsManager({ initial, counts }: { initial: Achievement[]; counts: Record<string, number> }) {
  const [items, setItems] = React.useState<Achievement[]>(initial);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Achievement | null>(null);
  const [deleting, setDeleting] = React.useState<Achievement | null>(null);
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase.from("achievements").select("*").order("title", { ascending: true });
    if (data) setItems(data as Achievement[]);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-achievements")
      .on("postgres_changes", { event: "*", schema: "public", table: "achievements" }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, refetch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">{items.length} badges · design the recognition system.</p>
        </div>
        <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" /> New Badge
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Award} title="No badges" description="Create your first achievement badge." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-start gap-3 p-4">
              <AchievementBadge achievement={a} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-semibold">{a.title}</h3>
                  <Badge variant="accent" className="shrink-0">{counts[a.id] ?? 0}</Badge>
                </div>
                {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                <div className="mt-2 flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Edit" onClick={() => { setEditing(a); setFormOpen(true); }}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" aria-label="Delete" onClick={() => setDeleting(a)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AchievementForm open={formOpen} onOpenChange={setFormOpen} achievement={editing} onSaved={refetch} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="The badge and all of its awards will be removed."
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteAchievement(deleting.id);
          if (res.ok) toast.success("Deleted"); else toast.error(res.error ?? "Failed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
