import { AnnouncementsManager } from "@/components/admin/managers/announcements-manager";
import { getAnnouncements } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await getAnnouncements();
  return <AnnouncementsManager initial={announcements} />;
}
