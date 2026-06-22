import Link from "next/link";
import { Users, UserCheck, ClipboardCheck, Award, RefreshCw, ArrowRight, BookOpen } from "lucide-react";
import { Hero } from "@/components/landing/hero";
import { TopPerformers } from "@/components/landing/top-performers";
import { ModuleCard } from "@/components/curriculum/module-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getCurriculum, getStats, getTopPerformers, getTeams } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [stats, teams, topStudents, modules] = await Promise.all([
    getStats(),
    getTeams(),
    getTopPerformers(10),
    getCurriculum(),
  ]);

  const topTeams = teams.slice(0, 3);

  return (
    <>
      {/* Keep landing stats / performers live */}
      <RealtimeRefresher tables={["students", "teams", "curriculum_modules"]} />

      <Hero />

      {/* Live statistics */}
      <section className="container py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Live Statistics</h2>
          <p className="text-muted-foreground">A real-time pulse of the HiveSchool community.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard index={0} label="Total Students" value={stats.totalStudents} icon="Users" accent="#7C3AED" />
          <StatCard index={1} label="Active Students" value={stats.activeStudents} icon="UserCheck" accent="#10B981" />
          <StatCard index={2} label="Assignments Done" value={stats.assignmentsCompleted} icon="ClipboardCheck" accent="#6366F1" />
          <StatCard index={3} label="Avg Score" value={stats.avgScore} icon="Award" accent="#F59E0B" format="decimal" />
          <StatCard
            index={4}
            label="Avg Attendance"
            value={stats.avgAttendance}
            icon="CalendarCheck"
            accent="#0EA5E9"
            format="percent1"
            hint={stats.leaderboardUpdatedAt ? `Updated ${timeAgo(stats.leaderboardUpdatedAt)}` : "Live"}
          />
        </div>
      </section>

      {/* Top teams */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Top Teams</h2>
            <p className="text-muted-foreground">The current top 3 on the leaderboard.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/teams">View all <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        {topTeams.length > 0 ? (
          <TopPerformers teams={topTeams} />
        ) : (
          <p className="text-sm text-muted-foreground">No teams recorded yet. Standings will update as soon as teams are created and ranked.</p>
        )}
      </section>

      {/* Top Students Preview */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Top Students</h2>
            <p className="text-muted-foreground">The leading individual performers in Cohort 5.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/leaderboard">View Leaderboard <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        {topStudents.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="divide-y divide-border">
              {topStudents.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-secondary/80 text-xs font-bold text-muted-foreground">
                      #{s.rank ?? idx + 1}
                    </span>
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white shadow-soft dark:ring-card">
                      {s.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.profile_image} alt={s.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-semibold text-white bg-accent/40 text-sm flex size-full items-center justify-center">
                          {s.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{s.name}</h4>
                      <p className="text-xs text-muted-foreground">{s.teams?.name ?? "No Team"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-muted-foreground">Assignments</p>
                      <p className="text-sm font-semibold tabular-nums">{Number(s.assignments_completed)}</p>
                    </div>
                    <div className="hidden w-28 md:block">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Attendance</span>
                        <span className="font-semibold tabular-nums text-foreground">{Number(s.attendance_percentage).toFixed(0)}%</span>
                      </div>
                      <Progress value={Number(s.attendance_percentage)} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                        {Number(s.final_score).toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No students recorded yet.</p>
        )}
      </section>

      {/* Curriculum preview */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Curriculum</h2>
            <p className="text-muted-foreground">A structured path from foundations to high-ticket mastery.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/curriculum"><BookOpen className="size-4" /> Explore</Link>
          </Button>
        </div>
        {modules.length > 0 ? (
          <div className="grid gap-3">
            {modules.slice(0, 4).map((m, i) => (
              <ModuleCard key={m.id} module={m} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Curriculum modules will appear here once published by an admin.</p>
        )}
      </section>

      {/* CTA */}
      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <div className="absolute inset-0 -z-0 bg-grid opacity-10" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Ready to climb the leaderboard?</h2>
            <p className="mt-3 text-primary-foreground/70">Track. Compete. Grow. See where you stand and what it takes to reach the top.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href="/leaderboard">View Leaderboard <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link href="/challenges">Daily Challenges</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
