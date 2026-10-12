import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { todayDate } from "@/lib/dates";
import { dueLabel, formatDate } from "@/lib/format";
import { renewIssueAction } from "@/lib/actions/library";
import { requireRole } from "@/lib/auth/get-current-user";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";

export const instant = false;

export const metadata = { title: "Active loans" };

export default async function ActiveLoansPage() {
  await requireRole(["admin", "librarian"]);
  const [issues, books, copies, members, users] = await Promise.all([
    issuesRepo.getAll(),
    booksRepo.getAll(),
    copiesRepo.getAll(),
    membersRepo.getAll(),
    usersRepo.getAll(),
  ]);
  const today = todayDate();
  const rows = issues.filter((issue) => issue.status === "issued" || issue.status === "overdue");
  return (
    <>
      <PageHeader title="Active loans" description="Renew a loan here, or open the return desk to take it back." />
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Member</th>
              <th className="p-3 font-medium">Book</th>
              <th className="p-3 font-medium">Due</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((issue) => {
              const member = members.find((row) => row.id === issue.memberId);
              const user = users.find((row) => row.id === member?.userId);
              return (
                <tr key={issue.id} className="border-t">
                  <td className="p-3">{user?.name}</td>
                  <td className="p-3">
                    {books.find((book) => book.id === issue.bookId)?.title}
                    <span className="block text-xs text-muted-foreground">
                      {copies.find((copy) => copy.id === issue.copyId)?.accessionNo}
                    </span>
                  </td>
                  <td className="p-3">
                    {formatDate(issue.dueDate)}
                    <span className="block text-xs text-muted-foreground">{dueLabel(issue.dueDate)}</span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={issue.dueDate < today ? "overdue" : issue.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton label="Renew" action={renewIssueAction} id={issue.id} />
                      <Link className="text-sm text-primary underline-offset-4 hover:underline" href={`/librarian/circulation/return?issue=${issue.id}`}>
                        Return
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
