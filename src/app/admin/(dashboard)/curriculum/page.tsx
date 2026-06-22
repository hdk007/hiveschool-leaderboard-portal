import { CurriculumManager } from "@/components/admin/managers/curriculum-manager";
import { MentorsManager } from "@/components/admin/managers/mentors-manager";
import { CampInfoEditor } from "@/components/admin/camp-info-editor";
import { getCampInfo, getCurriculum, getMentors } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage() {
  const [modules, mentors, camp] = await Promise.all([getCurriculum(), getMentors(), getCampInfo()]);
  return (
    <div className="space-y-8">
      <CampInfoEditor initial={camp} />
      <CurriculumManager initial={modules} />
      <MentorsManager initial={mentors} />
    </div>
  );
}
