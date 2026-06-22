import { CurriculumManager } from "@/components/admin/managers/curriculum-manager";
import { getCurriculum } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage() {
  const modules = await getCurriculum();
  return <CurriculumManager initial={modules} />;
}
