import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SimpleTable } from "@/components/shared/simple-table";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/get-current-user";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";

export const instant = false;

export const metadata = { title: "Members" };

export default async function MembersPage() {
  await requireRole(["admin", "librarian"]);
  const [members, users] = await Promise.all([membersRepo.getAll(), usersRepo.getAll()]);
  return (
    <>
      <PageHeader
        title="Members"
        description="Students and faculty who can borrow from the library."
        action={<Button nativeButton={false} render={<Link href="/librarian/members/new" />}>Add member</Button>}
      />
      <SimpleTable
        columns={[
          { key: "name", label: "Name", hrefKey: "href" },
          { key: "code", label: "Code" },
          { key: "type", label: "Type" },
          { key: "course", label: "Course / department" },
          { key: "status", label: "Status" },
          { key: "valid", label: "Valid till" },
        ]}
        rows={members.map((member) => ({
          name: users.find((user) => user.id === member.userId)?.name ?? member.memberCode,
          code: member.memberCode,
          type: member.memberType,
          course: member.course ?? member.department ?? "",
          status: member.status,
          valid: member.validTill,
          href: `/librarian/members/${member.id}`,
        }))}
      />
    </>
  );
}
