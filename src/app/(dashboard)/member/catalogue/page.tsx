import Link from "next/link";
import { CatalogueFilters } from "@/components/books/catalogue-filters";
import { ReserveButton } from "@/components/books/reserve-button";
import { BookCover } from "@/components/shared/book-cover";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/get-current-user";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { listBookSummaries } from "@/lib/services/catalogue.service";

export const instant = false;

export const metadata = { title: "Catalogue" };

export default async function MemberCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const user = await requireRole(["member"]);
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const category = params.category ?? "all";
  const member = await membersRepo.getByUserId(user.id);
  const [books, categories, active, reservations] = await Promise.all([
    listBookSummaries(),
    categoriesRepo.getAll(),
    member ? issuesRepo.getActiveIssuesByMember(member.id) : Promise.resolve([]),
    member ? reservationsRepo.getByMember(member.id) : Promise.resolve([]),
  ]);
  const filtered = books.filter((book) => {
    const matchesCategory = category === "all" || book.categoryId === category;
    const haystack = `${book.title} ${book.author} ${book.isbn}`.toLowerCase();
    return matchesCategory && (!q || haystack.includes(q));
  });
  return (
    <>
      <PageHeader title="Catalogue" description="Reserve a title when every copy is out." />
      <CatalogueFilters basePath="/member/catalogue" q={params.q ?? ""} category={category} categories={categories} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((book) => {
          const holding = active.some((issue) => issue.bookId === book.id);
          const queued = reservations.some((row) => row.bookId === book.id && (row.status === "waiting" || row.status === "ready"));
          const canReserve = Boolean(member && member.status === "active" && book.availableCopies === 0 && !holding && !queued);
          const reason = book.availableCopies > 0 ? "Available at the desk." : holding ? "You already hold this book." : queued ? "You are already in the queue." : "Join the waiting list.";
          return (
            <article key={book.id} className="flex gap-3 rounded-xl border p-3">
              <div className="w-20 shrink-0">
                <BookCover title={book.title} category={book.categoryName} coverImage={book.coverImage} />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <Link href={`/catalogue/${book.id}`} className="truncate font-medium">
                  {book.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">{book.author}</p>
                <StatusBadge status={book.availableCopies > 0 ? "available" : "issued"} />
                <ReserveButton bookId={book.id} disabled={!canReserve} reason={reason} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
