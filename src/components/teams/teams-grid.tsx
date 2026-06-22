"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Crown, Search, Users, Trophy, Swords } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RankBadge } from "@/components/shared/rank-badge";
import { TeamProfileModal } from "@/components/modals/team-profile-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Team } from "@/types/database";

interface Props {
  initialTeams: Team[];
}

export function TeamsGrid({ initialTeams }: Props) {
  const [teams, setTeams] = React.useState<Team[]>(initialTeams);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Team | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const supabase = React.useMemo(() => getSupabaseBrowserClient(), []);

  // Fetch updated teams list
  const fetchTeams = React.useCallback(async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("rank", { ascending: true, nullsFirst: false });
    if (data) {
      setTeams(data as Team[]);
    }
  }, [supabase]);

  // Real-time listener for changes in teams table
  React.useEffect(() => {
    const channel = supabase
      .channel("teams-grid-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => fetchTeams())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTeams]);

  const filteredTeams = React.useMemo(() => {
    if (!search) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [teams, search]);

  const openProfile = (t: Team) => {
    setSelected(t);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search teams by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 animate-fade-in"
        />
      </div>

      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No teams found"
          description={search ? "Try adjusting your search criteria." : "No teams have been created yet."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card
                onClick={() => openProfile(t)}
                className="group relative cursor-pointer overflow-hidden p-6 hover:shadow-glow border border-border bg-card transition-all"
              >
                {t.rank === 1 && (
                  <Crown className="absolute right-4 top-4 size-5 text-amber-400 animate-pulse" />
                )}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <Avatar src={t.team_logo} name={t.name} size={64} />
                    <span className="absolute -bottom-1 -right-1">
                      <RankBadge rank={t.rank} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate group-hover:text-accent transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Captain: {t.captain_name || "Unassigned"}
                    </p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-center">
                  <div className="rounded-lg bg-secondary/40 p-2.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Trophy className="size-3.5 text-warning" />
                      <span>Points</span>
                    </div>
                    <p className="mt-0.5 text-base font-bold tabular-nums">{Number(t.total_points).toFixed(1)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-2.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Swords className="size-3.5 text-accent" />
                      <span>Challenge</span>
                    </div>
                    <p className="mt-0.5 text-base font-bold tabular-nums">{Number(t.challenge_points).toFixed(0)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-2.5">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5 text-sky" />
                      <span>Students</span>
                    </div>
                    <p className="mt-0.5 text-base font-bold tabular-nums">{t.total_students}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <TeamProfileModal team={selected} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
