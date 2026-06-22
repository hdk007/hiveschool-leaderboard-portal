import { ChallengesManager } from "@/components/admin/managers/challenges-manager";
import { getChallenges } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminChallengesPage() {
  const challenges = await getChallenges();
  return <ChallengesManager initial={challenges} />;
}
