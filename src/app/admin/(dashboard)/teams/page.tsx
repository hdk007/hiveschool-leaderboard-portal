import { TeamsManager } from "@/components/admin/managers/teams-manager";
import { getTeams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const teams = await getTeams();
  return <TeamsManager initial={teams} />;
}
