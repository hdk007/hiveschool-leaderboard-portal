"use client";

import * as React from "react";
import { Plus, Search, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankBadge } from "@/components/shared/rank-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamForm } from "@/components/admin/forms/team-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteTeam, snapshotLeaderboard } from "@/app/actions/teams";
import { recalculateLeaderboard } from "@/app/actions/students";
import { formatCurrency } from "@/lib/utils";
import type { Team } from "@/types/database";
import { toast } from "sonner";

export function TeamsManager({ initial }: { initial: Team[] }) {
  const [teams, setTeams] = React.useState<Team[]>(initial);
  const [search, setSearch] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Team | null>(null);
  const [deleting, setDeleting] = React.useState<Team | null>(null);
  const [recalculating, setRecalculating] = React.useState(false);
  const [snapshotting, setSnapshotting] = React.useState(false);

  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase.from("teams").select("*").order("rank", { ascending: true, nullsFirst: false });
    if (data) setTeams(data as Team[]);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-teams")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, refetch)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  const filtered = teams.filter((t) => {
    return !search || t.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleRecalculate = async () => {
    setRecalculating(true);
    const res = await recalculateLeaderboard();
    setRecalculating(false);
    if (res.ok) toast.success("Leaderboard recalculated");
    else toast.error(res.error ?? "Failed to recalculate");
  };

  const handleSnapshot = async () => {
    setSnapshotting(true);
    const res = await snapshotLeaderboard();
    setSnapshotting(false);
    if (res.ok) toast.success("Snapshot captured successfully");
    else toast.error(res.error ?? "Failed to capture snapshot");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">{teams.length} teams · manage scores and ranks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSnapshot} disabled={snapshotting}>
            {snapshotting ? <Loader2 className="size-4 animate-spin" /> : null}
            Capture Snapshot
          </Button>
          <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Recalculate
          </Button>
          <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" /> Add Team
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search team name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Search} title="No teams found" description="Adjust your filters or create a new team." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">Rank</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead className="hidden sm:table-cell">Captain</TableHead>
                <TableHead className="hidden md:table-cell text-right">Students</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Challenge</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><RankBadge rank={t.rank} className="size-7 text-xs" /></TableCell>
                  <TableCell className="font-semibold">{t.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{t.captain_name ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular">{t.total_students}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right tabular text-muted-foreground">{Number(t.challenge_points).toFixed(0)}</TableCell>
                  <TableCell className="font-semibold text-right tabular">{Number(t.total_points).toFixed(1)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(t); setFormOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => setDeleting(t)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <TeamForm open={formOpen} onOpenChange={setFormOpen} team={editing} onSaved={refetch} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="This permanently removes the team and unassigns all student members. This cannot be undone."
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteTeam(deleting.id);
          if (res.ok) toast.success("Team deleted");
          else toast.error(res.error ?? "Failed to delete");
          setDeleting(null);
        }}
      />
    </div>
  );
}
