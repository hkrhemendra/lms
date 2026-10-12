import { PageHeader } from "@/components/layout/page-header";
import { MemberForm } from "@/components/members/member-form";
import { requireRole } from "@/lib/auth/get-current-user";

export const instant = false;

export const metadata = { title: "Add member" };

export default async function NewMemberPage() {
  await requireRole(["admin", "librarian"]);
  return (
    <>
      <PageHeader title="Register a member" description="This creates the login and the library membership together." />
      <MemberForm />
    </>
  );
}
