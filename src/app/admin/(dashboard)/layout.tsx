import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Protected admin layout. Middleware already redirects unauthenticated users;
 * this is defense-in-depth — it also enforces that the user is a real admin
 * (present in the `admins` table), not just any authenticated Supabase user.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const admin = await isAdmin();
  if (!admin) redirect("/admin/login");

  return <AdminShell adminEmail={user.email ?? "admin"}>{children}</AdminShell>;
}
