import { notFound } from "next/navigation";
import { BookForm } from "@/components/books/book-form";
import { CopyManager } from "@/components/books/copy-manager";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/get-current-user";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { booksRepo } from "@/lib/data/repositories/books.repo";

export const instant = false;

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "librarian"]);
  const { id } = await params;
  const [book, categories, copies] = await Promise.all([
    booksRepo.getById(id),
    categoriesRepo.getAll(),
    copiesRepo.byBook(id),
  ]);
  if (!book) notFound();
  return (
    <>
      <PageHeader title={book.title} description="Edit the record and manage physical copies." />
      <BookForm
        categories={categories}
        book={{
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          publisher: book.publisher,
          edition: book.edition,
          year: book.year,
          categoryId: book.categoryId,
          language: book.language,
          pages: book.pages ?? "",
          description: book.description ?? "",
          coverImage: book.coverImage ?? "",
        }}
      />
      <h2 className="text-lg font-medium">Copies</h2>
      <CopyManager bookId={book.id} copies={copies} />
    </>
  );
}
