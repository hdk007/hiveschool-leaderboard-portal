import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { getLeaderboard } from "@/lib/queries";
import { PAGE_SIZE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Live student rankings across sales revenue, assignments, attendance and challenges.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { students, total } = await getLeaderboard({ page: 1, pageSize: PAGE_SIZE, sortBy: "rank", ascending: true });

  return (
    <div className="container space-y-8 py-10">
      <PageHeader
        eyebrow="Live Standings"
        title="Leaderboard"
        description="Every score is computed live from individual sales revenue, assignments, attendance and challenge performance. Rankings update in real time across all devices."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <Radio className="size-3.5" /> Live
        </span>
      </PageHeader>

      <LeaderboardTable initialStudents={students} initialTotal={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
