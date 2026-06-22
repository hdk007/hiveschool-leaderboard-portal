"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Pin, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AnnouncementForm } from "@/components/admin/forms/announcement-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteAnnouncement } from "@/app/actions/announcements";
import { PRIORITY_STYLES } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { Announcement } from "@/types/database";
import { toast } from "sonner";

export function AnnouncementsManager({ initial }: { initial: Announcement[] }) {
  const [items, setItems] = React.useState<Announcement[]>(initial);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Announcement | null>(null);
  const [deleting, setDeleting] = React.useState<Announcement | null>(null);
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setItems(data as Announcement[]);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-announcements")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, refetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, refetch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">{items.length} posts · publish updates to all users.</p>
        </div>
        <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="size-4" /> New
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Create your first announcement." />
      ) : (
        <div className="grid gap-3">
          {items.map((a) => {
            const p = PRIORITY_STYLES[a.priority];
            return (
              <Card key={a.id} className={cn("p-4", a.is_pinned && "ring-1 ring-accent/30")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.is_pinned && <Pin className="size-3.5 rotate-45 text-accent" />}
                      <h3 className="truncate font-semibold">{a.title}</h3>
                      <Badge className={cn("border-transparent capitalize", p.className)}>{p.label}</Badge>
                    </div>
                    {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.created_at, { dateStyle: "medium" })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(a); setFormOpen(true); }}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => setDeleting(a)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AnnouncementForm open={formOpen} onOpenChange={setFormOpen} announcement={editing} onSaved={refetch} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title}”?`}
        description="This announcement will be removed for everyone."
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteAnnouncement(deleting.id);
          if (res.ok) toast.success("Deleted"); else toast.error(res.error ?? "Failed");
          setDeleting(null);
        }}
      />
    </div>
  );
}
