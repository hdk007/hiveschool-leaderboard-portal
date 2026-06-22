import { cn } from "@/lib/utils";

/**
 * Rank pill. Top 3 get gold / silver / bronze gradients; everyone else gets a
 * neutral chip. Used in the leaderboard and top-performers preview.
 */
export function RankBadge({ rank, className }: { rank: number | null; className?: string }) {
  if (rank == null) return <span className={cn("text-muted-foreground", className)}>—</span>;

  const styles: Record<number, string> = {
    1: "bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 shadow-soft",
    2: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-soft",
    3: "bg-gradient-to-br from-orange-300 to-amber-600 text-orange-950 shadow-soft",
  };

  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-sm font-bold tabular",
        styles[rank] ?? "bg-secondary text-foreground",
        className
      )}
    >
      {rank}
    </span>
  );
}

/** Rank change indicator (▲ gained / ▼ lost / — same). */
export function RankChange({
  rank,
  previousRank,
  className,
}: {
  rank: number | null;
  previousRank: number | null;
  className?: string;
}) {
  if (rank == null || previousRank == null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>new</span>;
  }
  const delta = previousRank - rank; // positive = climbed
  if (delta === 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular",
        up ? "text-success" : "text-destructive",
        className
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}
