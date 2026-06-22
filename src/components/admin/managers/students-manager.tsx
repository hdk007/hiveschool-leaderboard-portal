"use client";

import * as React from "react";
import { Plus, Search, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RankBadge } from "@/components/shared/rank-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentForm } from "@/components/admin/forms/student-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteStudent, recalculateLeaderboard } from "@/app/actions/students";
import { formatCurrency } from "@/lib/utils";
import type { Student, Team } from "@/types/database";
import { toast } from "sonner";

export function StudentsManager({ initial, teams }: { initial: (Student & { teams: { name: string } | null })[]; teams: Team[] }) {
  const [students, setStudents] = React.useState<(Student & { teams: { name: string } | null })[]>(initial);
  const [search, setSearch] = React.useState("");
  const [teamId, setTeamId] = React.useState("all");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<(Student & { teams: { name: string } | null }) | null>(null);
  const [deleting, setDeleting] = React.useState<Student | null>(null);
  const [recalculating, setRecalculating] = React.useState(false);

  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  const refetch = React.useCallback(async () => {
    const { data } = await supabase
      .from("students")
      .select("*, teams(name)")
      .order("name", { ascending: true });
    if (data) setStudents(data as any);
  }, [supabase]);

  React.useEffect(() => {
    const channel = supabase
      .channel("admin-students")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, refetch)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  const filtered = students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchTeam = teamId === "all" || s.team_id === teamId;
    return matchSearch && matchTeam;
  });

  const handleRecalculate = async () => {
    setRecalculating(true);
    const res = await recalculateLeaderboard();
    setRecalculating(false);
    if (res.ok) toast.success("Leaderboard recalculated");
    else toast.error(res.error ?? "Failed");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">{students.length} students · add, edit, and manage profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Recalculate
          </Button>
          <Button variant="accent" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4" /> Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="sm:w-48">
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Search} title="No students found" description="Adjust your filters or add a new student." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Student</TableHead>
                <TableHead className="hidden md:table-cell">Team</TableHead>
                <TableHead className="hidden sm:table-cell">Attendance</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={s.profile_image} name={s.name} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{s.teams?.name ?? "No Team"}</Badge>
                  </TableCell>
                  <TableCell className="hidden tabular sm:table-cell">
                    {Number(s.attendance_percentage).toFixed(1)}%
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={s.status === "active" ? "success" : "secondary"}>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(s); setFormOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive" onClick={() => setDeleting(s)}>
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

      <StudentForm open={formOpen} onOpenChange={setFormOpen} student={editing} teams={teams} onSaved={refetch} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="This permanently removes the student and all related records. This cannot be undone."
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteStudent(deleting.id);
          if (res.ok) toast.success("Student deleted");
          else toast.error(res.error ?? "Failed to delete");
          setDeleting(null);
        }}
      />
    </div>
  );
}
