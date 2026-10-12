import { PageHeader } from "@/components/layout/page-header";
import { IssueDesk } from "@/components/circulation/issue-desk";
import { requireRole } from "@/lib/auth/get-current-user";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { finesRepo } from "@/lib/data/repositories/fines.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { evaluateIssue } from "@/lib/services/circulation.service";

export const instant = false;

export const metadata = { title: "Issue desk" };

export default async function IssuePage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; copy?: string }>;
}) {
  await requireRole(["admin", "librarian"]);
  const params = await searchParams;
  const [members, users, books, copies, settings] = await Promise.all([
    membersRepo.getAll(),
    usersRepo.getAll(),
    booksRepo.getAll(),
    copiesRepo.getAll(),
    settingsRepo.get(),
  ]);
  const memberRows = await Promise.all(
    members.map(async (member) => {
      const active = await issuesRepo.getActiveIssuesByMember(member.id);
      const unpaid = await finesRepo.getUnpaidTotal(member.id);
      const rule = member.memberType === "faculty" ? settings.faculty : settings.student;
      return {
        id: member.id,
        name: users.find((user) => user.id === member.userId)?.name ?? member.memberCode,
        code: member.memberCode,
        type: member.memberType,
        active: active.length,
        limit: rule.issueLimit,
        unpaid,
      };
    }),
  );
  const copyRows = copies
    .filter((copy) => copy.status === "available" || copy.status === "reserved")
    .map((copy) => ({
      id: copy.id,
      label: `${books.find((book) => book.id === copy.bookId)?.title ?? "Book"} · ${copy.accessionNo} · ${books.find((book) => book.id === copy.bookId)?.isbn ?? ""}`,
      status: copy.status,
    }));
  const checks = params.member && params.copy ? await evaluateIssue(params.member, params.copy) : null;
  return (
    <>
      <PageHeader title="Issue desk" description="Pick a member, then a copy. The rules are checked before you confirm." />
      <IssueDesk members={memberRows} copies={copyRows} memberId={params.member} copyId={params.copy} checks={checks} />
    </>
  );
}
