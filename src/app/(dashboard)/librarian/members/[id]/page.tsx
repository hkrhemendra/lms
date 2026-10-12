import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { MemberActions } from "@/components/members/member-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { SimpleTable } from "@/components/shared/simple-table";
import { formatDate, formatINR } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { finesRepo } from "@/lib/data/repositories/fines.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";

export const instant = false;

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "librarian"]);
  const { id } = await params;
  const member = await membersRepo.getById(id);
  if (!member) notFound();
  const [user, issues, books, fines, reservations] = await Promise.all([
    usersRepo.getById(member.userId),
    issuesRepo.getByMember(member.id),
    booksRepo.getAll(),
    finesRepo.getByMember(member.id),
    reservationsRepo.getByMember(member.id),
  ]);
  const titleOf = (bookId: string) => books.find((book) => book.id === bookId)?.title ?? "Book";
  return (
    <>
      <PageHeader
        title={user?.name ?? member.memberCode}
        description={`${member.memberCode} · ${member.memberType} · valid till ${formatDate(member.validTill)}`}
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={member.status} />
        <StatusBadge status={user?.status ?? "active"} />
      </div>
      <p className="text-sm text-muted-foreground">
        {member.phone}
        {member.address ? ` · ${member.address}` : ""} · {member.course ?? member.department}
      </p>
      <MemberActions member={member} />
      <h2 className="text-lg font-medium">Loans</h2>
      <SimpleTable
        columns={[
          { key: "book", label: "Book" },
          { key: "issued", label: "Issued" },
          { key: "due", label: "Due" },
          { key: "status", label: "Status" },
        ]}
        rows={issues.map((issue) => ({
          book: titleOf(issue.bookId),
          issued: formatDate(issue.issueDate),
          due: formatDate(issue.dueDate),
          status: issue.status,
        }))}
      />
      <h2 className="text-lg font-medium">Fines</h2>
      <SimpleTable
        columns={[
          { key: "amount", label: "Amount" },
          { key: "reason", label: "Reason" },
          { key: "status", label: "Status" },
        ]}
        rows={fines.map((fine) => ({ amount: formatINR(fine.amount), reason: fine.reason, status: fine.status }))}
      />
      <h2 className="text-lg font-medium">Reservations</h2>
      <SimpleTable
        columns={[
          { key: "book", label: "Book" },
          { key: "status", label: "Status" },
          { key: "position", label: "Position" },
        ]}
        rows={reservations.map((row) => ({ book: titleOf(row.bookId), status: row.status, position: row.position }))}
      />
    </>
  );
}
