import type { Metadata } from "next";
import { Swords } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { EmptyState } from "@/components/shared/empty-state";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getChallengeParticipantCounts, getChallenges } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Daily Challenges",
  description: "Compete in daily challenges to earn points and climb the leaderboard.",
};

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const [challenges, counts] = await Promise.all([getChallenges(), getChallengeParticipantCounts()]);

  const active = challenges.filter((c) => c.status === "active");
  const others = challenges.filter((c) => c.status !== "active");

  return (
    <div className="container space-y-8 py-10">
      <RealtimeRefresher tables={["daily_challenges", "student_challenge_scores"]} />
      <PageHeader
        eyebrow="Compete"
        title="Daily Challenges"
        description="Join daily challenges to score points for your team, boosting your team's overall leaderboard rank."
      />

      {challenges.length === 0 ? (
        <EmptyState icon={Swords} title="No challenges yet" description="New challenges will be posted here each day." />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-success" />
                </span>
                Active Now
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((c, i) => (
                  <ChallengeCard key={c.id} challenge={c} participants={counts[c.id] ?? 0} index={i} />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">All Challenges</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((c, i) => (
                  <ChallengeCard key={c.id} challenge={c} participants={counts[c.id] ?? 0} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
