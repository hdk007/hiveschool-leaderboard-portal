import { StudentsManager } from "@/components/admin/managers/students-manager";
import { getAllStudents, getTeams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const [students, teams] = await Promise.all([getAllStudents(), getTeams()]);
  return <StudentsManager initial={students} teams={teams} />;
}
