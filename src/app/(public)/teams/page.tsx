import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TeamsGrid } from "@/components/teams/teams-grid";
import { getTeams } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Teams",
  description: "Live bootcamp team standings and member lists.",
};

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="container space-y-8 py-10">
      <PageHeader
        eyebrow="Bootcamp Standings"
        title="Teams Standings"
        description="View and compare team standings based on their active student points. Click on any team card to open its profile and see individual student scores."
      />

      <TeamsGrid initialTeams={teams} />
    </div>
  );
}
