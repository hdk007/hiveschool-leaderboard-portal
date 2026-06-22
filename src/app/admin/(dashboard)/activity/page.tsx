import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { RealtimeRefresher } from "@/components/layout/realtime-refresher";
import { getActivityLogs } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const logs = await getActivityLogs(100);

  return (
    <div className="space-y-6">
      <RealtimeRefresher tables={["activity_logs"]} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">A complete, real-time audit trail of every admin action.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>{logs.length} most recent entries.</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed initial={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
