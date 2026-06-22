import { SettingsForm } from "@/components/admin/settings-form";
import { getAllStudents, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, students] = await Promise.all([getSettings(), getAllStudents()]);
  return <SettingsForm settings={settings} students={students} />;
}
