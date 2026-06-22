import Link from "next/link";
import { Home, Trophy } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-secondary/30 px-4 text-center">
      <Logo />
      <p className="text-7xl font-bold tracking-tight text-gradient">404</p>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">The page you’re looking for doesn’t exist or has moved.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="accent">
          <Link href="/"><Home className="size-4" /> Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/leaderboard"><Trophy className="size-4" /> Leaderboard</Link>
        </Button>
      </div>
    </div>
  );
}
