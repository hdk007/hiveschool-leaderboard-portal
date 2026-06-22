import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ModuleCard } from "@/components/curriculum/module-card";
import { EmptyState } from "@/components/shared/empty-state";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getCurriculum } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Curriculum",
  description: "The HiveSchool sales mastery curriculum — from foundations to high-ticket closing.",
};

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const modules = await getCurriculum();
  const avgCompletion = modules.length
    ? Math.round(modules.reduce((s, m) => s + m.completion_percentage, 0) / modules.length)
    : 0;

  return (
    <div className="container space-y-8 py-10">
      <RealtimeRefresher tables={["curriculum_modules"]} />
      <PageHeader
        eyebrow="Learning Path"
        title="Curriculum"
        description="A structured, eight-module journey designed to turn beginners into high-performing closers."
      >
        <div className="rounded-xl border border-border bg-card px-4 py-2 text-center">
          <p className="text-2xl font-bold tabular text-accent">{avgCompletion}%</p>
          <p className="text-xs text-muted-foreground">Avg. completion</p>
        </div>
      </PageHeader>

      {modules.length === 0 ? (
        <EmptyState icon={BookOpen} title="No modules yet" description="Curriculum modules will appear here once added by an admin." />
      ) : (
        <div className="grid gap-3">
          {modules.map((m, i) => (
            <ModuleCard key={m.id} module={m} index={i} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
