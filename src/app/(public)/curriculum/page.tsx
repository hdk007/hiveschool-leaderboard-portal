import type { Metadata } from "next";
import { BookOpen, CalendarDays, MapPin, Clock, Backpack, Users } from "lucide-react";
import { ModuleCard } from "@/components/curriculum/module-card";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getCampInfo, getCurriculum, getMentors } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Curriculum",
  description: "The BuildCamp week — build a real venture from problem to pitch, day by day.",
};

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const [camp, modules, mentors] = await Promise.all([getCampInfo(), getCurriculum(), getMentors()]);
  const avgCompletion = modules.length
    ? Math.round(modules.reduce((s, m) => s + m.completion_percentage, 0) / modules.length)
    : 0;

  return (
    <div className="container space-y-10 py-10">
      <RealtimeRefresher tables={["curriculum_modules", "mentors", "camp_info"]} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
        <div className="absolute inset-0 -z-0 bg-grid opacity-10" />
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary-foreground/60">Learning Path</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{camp?.name ?? "Curriculum"}</h1>
              {camp?.subtitle && <p className="mt-2 max-w-xl text-primary-foreground/70">{camp.subtitle}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {camp?.date_range && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm">
                    <CalendarDays className="size-3.5" /> {camp.date_range}
                  </span>
                )}
                {camp?.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm">
                    <MapPin className="size-3.5" /> {camp.location}
                  </span>
                )}
              </div>
            </div>
            {modules.length > 0 && (
              <div className="shrink-0 rounded-2xl bg-white/10 px-5 py-3 text-center backdrop-blur">
                <p className="text-3xl font-bold tabular">{avgCompletion}%</p>
                <p className="text-xs text-primary-foreground/70">Avg. completion</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Logistics */}
      {camp && (camp.when_to_come?.length > 0 || camp.what_to_bring?.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          {camp.when_to_come?.length > 0 && (
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold">
                <Clock className="size-4 text-accent" /> When to come
              </p>
              <ul className="space-y-2">
                {camp.when_to_come.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" /> {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {camp.what_to_bring?.length > 0 && (
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-2 font-semibold">
                <Backpack className="size-4 text-accent" /> What to bring
              </p>
              <ul className="space-y-2">
                {camp.what_to_bring.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" /> {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      {/* Days */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your week, day by day</h2>
          <p className="text-muted-foreground">Tap any day to see the full schedule.</p>
        </div>
        {modules.length === 0 ? (
          <EmptyState icon={BookOpen} title="No days yet" description="Curriculum days will appear here once added by an admin." />
        ) : (
          <div className="grid gap-3">
            {modules.map((m, i) => (
              <ModuleCard key={m.id} module={m} index={i} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </section>

      {/* Mentors */}
      {mentors.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Users className="size-6 text-accent" /> Your mentors
            </h2>
            <p className="text-muted-foreground">The people building this week with you.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((m) => (
              <Card key={m.id} className="flex items-start gap-3 p-4 transition-shadow hover:shadow-card">
                <Avatar src={m.photo} name={m.name} size={48} />
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{m.name}</p>
                  {m.role && <p className="text-xs font-medium text-accent">{m.role}</p>}
                  {m.bio && <p className="mt-1 text-xs text-muted-foreground">{m.bio}</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
