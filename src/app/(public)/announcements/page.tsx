import type { Metadata } from "next";
import { Megaphone, Pin } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getAnnouncements } from "@/lib/queries";
import { PRIORITY_STYLES } from "@/lib/constants";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { Announcement } from "@/types/database";

export const metadata: Metadata = {
  title: "Announcements",
  description: "The latest updates, news, and notices from HiveSchool.",
};

export const dynamic = "force-dynamic";

function AnnouncementItem({ a }: { a: Announcement }) {
  const p = PRIORITY_STYLES[a.priority];
  return (
    <Card className={cn("animate-fade-in p-5", a.is_pinned && "ring-1 ring-accent/30")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {a.is_pinned && <Pin className="size-4 rotate-45 text-accent" />}
          <h3 className="font-semibold">{a.title}</h3>
        </div>
        <Badge className={cn("border-transparent capitalize", p.className)}>{p.label}</Badge>
      </div>
      {a.description && <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>}
      <p className="mt-3 text-xs text-muted-foreground" title={formatDate(a.created_at, { dateStyle: "full", timeStyle: "short" })}>
        {formatDate(a.created_at, { dateStyle: "medium" })} · {timeAgo(a.created_at)}
      </p>
    </Card>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();
  const pinned = announcements.filter((a) => a.is_pinned);
  const rest = announcements.filter((a) => !a.is_pinned);

  return (
    <div className="container space-y-8 py-10">
      <RealtimeRefresher tables={["announcements"]} />
      <PageHeader eyebrow="News & Updates" title="Announcements" description="Stay in the loop with the latest from the HiveSchool team." />

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Important updates will be posted here." />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Pin className="size-3.5 rotate-45 text-accent" /> Pinned
              </h2>
              {pinned.map((a) => (
                <AnnouncementItem key={a.id} a={a} />
              ))}
            </div>
          )}
          <div className="space-y-3">
            {rest.map((a) => (
              <AnnouncementItem key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
