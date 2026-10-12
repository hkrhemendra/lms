import Link from "next/link";
import { notFound } from "next/navigation";
import { ReserveButton } from "@/components/books/reserve-button";
import { BookCover } from "@/components/shared/book-cover";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { getBookSummary } from "@/lib/services/catalogue.service";

export const instant = false;

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = await getBookSummary(bookId);
  if (!book) notFound();
  const [copies, user] = await Promise.all([copiesRepo.byBook(bookId), getCurrentUser()]);
  let canReserve = false;
  let reserveReason = "Log in as a member to reserve this book.";
  if (user?.role === "member") {
    const member = await membersRepo.getByUserId(user.id);
    if (member) {
      const [active, queue] = await Promise.all([
        issuesRepo.getActiveIssuesByMember(member.id),
        reservationsRepo.getQueue(bookId),
      ]);
      if (book.availableCopies > 0) reserveReason = "A copy is available at the desk.";
      else if (member.status !== "active") reserveReason = "Your membership is not active.";
      else if (active.some((issue) => issue.bookId === bookId)) reserveReason = "You already hold this book.";
      else if (queue.some((row) => row.memberId === member.id)) reserveReason = "You are already in the queue.";
      else {
        canReserve = true;
        reserveReason = "No copy is free. Join the queue.";
      }
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <Button variant="ghost" className="w-fit" nativeButton={false} render={<Link href="/catalogue" />}>
        Back to catalogue
      </Button>
      <div className="grid gap-6 md:grid-cols-[180px_1fr]">
        <BookCover title={book.title} category={book.categoryName} coverImage={book.coverImage} />
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="text-sm text-muted-foreground">
            {book.author} · {book.edition} · {book.year}
          </p>
          <p className="text-sm">{book.description}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>ISBN {book.isbn}</div>
            <div>{book.publisher}</div>
            <div>{book.categoryName}</div>
            <div>
              {book.availableCopies} of {book.totalCopies} available
            </div>
          </dl>
          {user?.role === "member" ? <ReserveButton bookId={book.id} disabled={!canReserve} reason={reserveReason} /> : null}
          {!user ? (
            <Button className="w-fit" nativeButton={false} render={<Link href={`/login?next=/catalogue/${book.id}`} />}>
              Login to reserve
            </Button>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Accession</th>
              <th className="p-3 font-medium">Rack</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((copy) => (
              <tr key={copy.id} className="border-t">
                <td className="p-3">{copy.accessionNo}</td>
                <td className="p-3">{copy.rackNo}</td>
                <td className="p-3">
                  <StatusBadge status={copy.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
