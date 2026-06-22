"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw, Camera, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalculateLeaderboard } from "@/app/actions/students";
import { snapshotLeaderboard } from "@/app/actions/settings";
import { toast } from "sonner";

export function LeaderboardActions() {
  const [recalc, setRecalc] = React.useState(false);
  const [snap, setSnap] = React.useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/settings"><SlidersHorizontal className="size-4" /> Weights</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={snap}
        onClick={async () => {
          setSnap(true);
          const res = await snapshotLeaderboard();
          setSnap(false);
          res.ok ? toast.success("Snapshot captured") : toast.error(res.error ?? "Failed");
        }}
      >
        {snap ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} Snapshot
      </Button>
      <Button
        variant="accent"
        size="sm"
        disabled={recalc}
        onClick={async () => {
          setRecalc(true);
          const res = await recalculateLeaderboard();
          setRecalc(false);
          res.ok ? toast.success("Leaderboard recalculated") : toast.error(res.error ?? "Failed");
        }}
      >
        {recalc ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Recalculate
      </Button>
    </div>
  );
}
