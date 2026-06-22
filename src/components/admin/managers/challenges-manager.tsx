"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Swords, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ChallengeForm } from "@/components/admin/forms/challenge-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteChallenge } from "@/app/actions/challenges";
import { CHALLENGE_STATUS_STYLES } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { DailyChallenge } from "@/types/database";
import { toast } from "sonner";
import { ChallengeScoresModal } from "@/components/admin/modals/challenge-scores-modal";

export function ChallengesManager({ initial }: { initial: DailyChallenge[] }) {
  const [items, setItems] = React.useState<DailyChallenge[]>(initial);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DailyChallenge | null>(null);
  const [deleting, setDeleting] = React.useState<DailyChallenge | null>(null);
  const [scoring, setScoring] = React.useState<DailyChallenge | null>(null);
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase.from("daily_challenges").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as DailyChallenge[]);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-challenges")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_challenges" }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, refetch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Challenges</h1>
          <p className="text-muted-foreground">{items.length} challenges · create and manage daily competitions.</p>
        </div>
        <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" /> New
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Swords} title="No challenges" description="Create your first daily challenge." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const status = CHALLENGE_STATUS_STYLES[c.status];
            return (
              <Card key={c.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between">
                  <Badge className={cn("border-transparent", status.className)}>{status.label}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Grade" className="text-warning hover:text-warning" onClick={() => setScoring(c)}>
                      <Trophy className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(c); setFormOpen(true); }}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => setDeleting(c)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="mt-2 font-semibold">{c.title}</h3>
                {c.description && <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{c.description}</p>}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Trophy className="size-3.5 text-warning" /> {c.points} pts</span>
                  <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {c.deadline ? formatDate(c.deadline) : "No deadline"}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ChallengeForm open={formOpen} onOpenChange={setFormOpen} challenge={editing} onSaved={refetch} />
      <ChallengeScoresModal open={Boolean(scoring)} onOpenChange={(o) => !o && setScoring(null)} challenge={scoring} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteChallenge(deleting.id);
          if (res.ok) toast.success("Deleted"); else toast.error(res.error ?? "Failed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
