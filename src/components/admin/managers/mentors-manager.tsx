"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { MentorForm } from "@/components/admin/forms/mentor-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteMentor } from "@/app/actions/curriculum";
import type { Mentor } from "@/types/database";
import { toast } from "sonner";

export function MentorsManager({ initial }: { initial: Mentor[] }) {
  const [mentors, setMentors] = React.useState<Mentor[]>(initial);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Mentor | null>(null);
  const [deleting, setDeleting] = React.useState<Mentor | null>(null);
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase.from("mentors").select("*").order("order_index", { ascending: true });
    if (data) setMentors(data as Mentor[]);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-mentors")
      .on("postgres_changes", { event: "*", schema: "public", table: "mentors" }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, refetch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Users className="size-5 text-accent" /> Mentors
          </h2>
          <p className="text-sm text-muted-foreground">{mentors.length} mentors · shown on the public curriculum page.</p>
        </div>
        <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" /> Add Mentor
        </Button>
      </div>

      {mentors.length === 0 ? (
        <EmptyState icon={Users} title="No mentors" description="Add the people running the program." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {mentors.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 p-3">
              <Avatar src={m.photo} name={m.name} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-tight">{m.name}</p>
                {m.role && <p className="truncate text-xs text-accent">{m.role}</p>}
                {m.bio && <p className="truncate text-xs text-muted-foreground">{m.bio}</p>}
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

      <MentorForm open={formOpen} onOpenChange={setFormOpen} mentor={editing} onSaved={refetch} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${deleting?.name}?`}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteMentor(deleting.id);
          if (res.ok) toast.success("Mentor removed"); else toast.error(res.error ?? "Failed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
