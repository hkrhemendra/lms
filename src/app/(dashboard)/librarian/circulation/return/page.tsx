import { PageHeader } from "@/components/layout/page-header";
import { ReturnDesk } from "@/components/circulation/return-desk";
import { requireRole } from "@/lib/auth/get-current-user";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { previewReturn } from "@/lib/services/circulation.service";
import type { ReturnCondition } from "@/types";

export const instant = false;

export const metadata = { title: "Return desk" };

export default async function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; issue?: string; condition?: ReturnCondition; damage?: string }>;
}) {
  await requireRole(["admin", "librarian"]);
  const params = await searchParams;
  const [issues, books, copies, members, users] = await Promise.all([
    issuesRepo.getAll(),
    booksRepo.getAll(),
    copiesRepo.getAll(),
    membersRepo.getAll(),
    usersRepo.getAll(),
  ]);
  const q = (params.q ?? "").trim().toLowerCase();
  const active = issues
    .filter((issue) => issue.status === "issued" || issue.status === "overdue")
    .map((issue) => {
      const member = members.find((row) => row.id === issue.memberId);
      const user = users.find((row) => row.id === member?.userId);
      const copy = copies.find((row) => row.id === issue.copyId);
      return {
        id: issue.id,
        label: `${books.find((book) => book.id === issue.bookId)?.title ?? "Book"} · ${copy?.accessionNo ?? ""} · ${user?.name ?? ""} ${member?.memberCode ?? ""}`,
      };
    })
    .filter((row) => !q || row.label.toLowerCase().includes(q));
  const condition = params.condition ?? "good";
  const damage = params.damage ? Number(params.damage) : undefined;
  const preview = params.issue ? await previewReturn(params.issue, condition, damage).catch((error: Error) => ({ message: error.message })) : null;
  return (
    <>
      <PageHeader title="Return desk" description="Find the loan, check the fine, then confirm the condition." />
      <ReturnDesk
        q={params.q ?? ""}
        loans={active.slice(0, 12)}
        issueId={params.issue}
        condition={condition}
        damage={params.damage ?? ""}
        message={preview && "message" in preview ? preview.message : null}
      />
    </>
  );
}
