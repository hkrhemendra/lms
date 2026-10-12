import Link from "next/link";
import { CatalogueFilters } from "@/components/books/catalogue-filters";
import { BookCover } from "@/components/shared/book-cover";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";
import { listBookSummaries } from "@/lib/services/catalogue.service";

export const instant = false;

export const metadata = { title: "Catalogue" };

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const category = params.category ?? "";
  const [books, categories] = await Promise.all([listBookSummaries(), categoriesRepo.getAll()]);
  const filtered = books.filter((book) => {
    const matchesCategory = !category || category === "all" || book.categoryId === category;
    const haystack = `${book.title} ${book.author} ${book.isbn}`.toLowerCase();
    return matchesCategory && (!q || haystack.includes(q));
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <PageHeader title="Catalogue" description="Browse what the library holds and see what is on the shelf." />
      <CatalogueFilters basePath="/catalogue" q={params.q ?? ""} category={category || "all"} categories={categories} />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No books match that search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((book) => (
            <Link key={book.id} href={`/catalogue/${book.id}`} className="flex flex-col gap-3 rounded-xl">
              <BookCover title={book.title} category={book.categoryName} coverImage={book.coverImage} />
              <div className="flex flex-col gap-1">
                <p className="truncate text-sm font-medium">{book.title}</p>
                <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                <StatusBadge status={book.availableCopies > 0 ? "available" : "issued"} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
