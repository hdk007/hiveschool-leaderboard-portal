"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ArrowUp,
  ArrowDown,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { RankBadge, RankChange } from "@/components/shared/rank-badge";
import { StudentProfileModal } from "@/components/modals/student-profile-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { exportLeaderboardCSV, exportLeaderboardPDF, type ExportStudent } from "@/lib/export";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { Student } from "@/types/database";
import { toast } from "sonner";

type StudentWithTeam = Student & { teams: { name: string; team_logo: string | null } | null };

interface Props {
  initialStudents: StudentWithTeam[];
  initialTotal: number;
  pageSize?: number;
}

type SortKey = "rank" | "final_score" | "assignments_completed" | "attendance_percentage" | "growth_percentage";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rank", label: "Rank" },
  { value: "final_score", label: "Final Score" },
  { value: "assignments_completed", label: "Assignments" },
  { value: "attendance_percentage", label: "Attendance" },
  { value: "growth_percentage", label: "Growth" },
];

export function LeaderboardTable({ initialStudents, initialTotal, pageSize = 10 }: Props) {
  const [students, setStudents] = React.useState<StudentWithTeam[]>(initialStudents);
  const [total, setTotal] = React.useState(initialTotal);
  const [loading, setLoading] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortKey>("rank");
  const [ascending, setAscending] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("");
  const [teamsList, setTeamsList] = React.useState<{ id: string; name: string }[]>([]);

  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Load teams list for filtering
  React.useEffect(() => {
    async function loadTeams() {
      const { data } = await supabase.from("teams").select("id, name").order("name");
      if (data) setTeamsList(data);
    }
    loadTeams();
  }, [supabase]);

  // Debounce the search box.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const buildQuery = React.useCallback(
    (withRange: boolean) => {
      let q = supabase
        .from("students")
        .select("*, teams(name, team_logo)", { count: "exact" })
        .eq("status", "active");

      if (search) q = q.ilike("name", `%${search}%`);
      if (selectedTeamId) q = q.eq("team_id", selectedTeamId);

      q = q.order(sortBy, { ascending, nullsFirst: false });
      if (withRange) {
        const from = (page - 1) * pageSize;
        q = q.range(from, from + pageSize - 1);
      }
      return q;
    },
    [supabase, search, sortBy, ascending, page, pageSize, selectedTeamId]
  );

  const fetchPage = React.useCallback(async () => {
    setLoading(true);
    const { data, count, error } = await buildQuery(true);
    if (!error) {
      setStudents((data ?? []) as StudentWithTeam[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [buildQuery]);

  React.useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Live updates on students database changes
  React.useEffect(() => {
    const channel = supabase
      .channel("leaderboard-students-table")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => fetchPage())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchPage]);

  const openProfile = (id: string) => {
    setSelectedStudentId(id);
    setModalOpen(true);
  };

  const handleExport = async (kind: "csv" | "pdf") => {
    try {
      setExporting(true);
      const { data } = await buildQuery(false);
      const rows = (data ?? []) as ExportStudent[];
      if (kind === "csv") exportLeaderboardCSV(rows);
      else await exportLeaderboardPDF(rows);
      toast.success(`Exported ${rows.length} rows as ${kind.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:max-w-xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48"
          >
            <option value="">All Teams</option>
            {teamsList.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="w-auto min-w-[8rem]">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </Select>
          <Button variant="outline" size="icon" aria-label="Toggle sort direction" onClick={() => setAscending((a) => !a)}>
            {ascending ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
            <Download className="size-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} disabled={exporting}>
            <FileText className="size-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Final Score</TableHead>
              <TableHead className="hidden text-center sm:table-cell">Assignments</TableHead>
              <TableHead className="hidden lg:table-cell">Attendance</TableHead>
              <TableHead>Growth</TableHead>
              <TableHead className="hidden xl:table-cell">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && students.length === 0 ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10">
                  {search || selectedTeamId ? (
                    <EmptyState icon={Search} title="No students found" description="Try adjusting your search or filters." />
                  ) : (
                    <EmptyState icon={Users} title="Welcome to the Leaderboard!" description="No active students recorded. Register students to view the live rankings." />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {students.map((s) => (
                  <motion.tr
                    key={s.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => openProfile(s.id)}
                    className="cursor-pointer border-b border-border transition-colors hover:bg-secondary/60"
                  >
                    <TableCell><RankBadge rank={s.rank} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={s.profile_image} name={s.name} size={36} />
                        <div>
                          <span className="font-semibold block">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground block">{s.batch}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {s.teams ? (
                        <div className="flex items-center gap-2">
                          <Avatar src={s.teams.team_logo} name={s.teams.name} size={20} />
                          <span className="text-sm font-medium">{s.teams.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Team</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold tabular">{Number(s.final_score).toFixed(1)}</TableCell>
                    <TableCell className="hidden tabular text-center sm:table-cell">{formatNumber(s.assignments_completed)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex w-28 items-center gap-2">
                        <Progress value={Number(s.attendance_percentage)} className="h-1.5 flex-1" />
                        <span className="w-9 shrink-0 text-right text-xs tabular text-muted-foreground">{Number(s.attendance_percentage).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell><RankChange rank={s.rank} previousRank={s.previous_rank} /></TableCell>
                    <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground xl:table-cell">{timeAgo(s.updated_at)}</TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {loading ? (
            <span className="inline-flex items-center gap-1"><Loader2 className="size-3.5 animate-spin" /> Updating…</span>
          ) : (
            <>Showing <span className="font-medium text-foreground">{students.length}</span> of <span className="font-medium text-foreground">{total}</span> students</>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <span className="text-sm tabular">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <StudentProfileModal studentId={selectedStudentId} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
