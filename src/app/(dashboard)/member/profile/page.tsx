import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/member/profile-form";
import { requireRole } from "@/lib/auth/get-current-user";
import { membersRepo } from "@/lib/data/repositories/members.repo";

export const instant = false;

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireRole(["member"]);
  const member = await membersRepo.getByUserId(user.id);
  if (!member) return null;
  return (
    <>
      <PageHeader title="Profile" description={`${member.memberCode} · ${member.memberType} · ${member.course ?? member.department ?? ""}`} />
      <ProfileForm phone={member.phone} address={member.address ?? ""} photoUrl={member.photoUrl ?? ""} />
    </>
  );
}
