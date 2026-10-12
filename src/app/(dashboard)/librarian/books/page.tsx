import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SimpleTable } from "@/components/shared/simple-table";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/get-current-user";
import { listBookSummaries } from "@/lib/services/catalogue.service";

export const instant = false;

export const metadata = { title: "Books" };

export default async function BooksPage() {
  await requireRole(["admin", "librarian"]);
  const books = await listBookSummaries();
  return (
    <>
      <PageHeader
        title="Books"
        description="Search the catalogue and open a title to manage copies."
        action={
          <Button nativeButton={false} render={<Link href="/librarian/books/new" />}>Add book</Button>
        }
      />
      <SimpleTable
        searchPlaceholder="Search title, author, or ISBN"
        columns={[
          { key: "title", label: "Title", hrefKey: "href" },
          { key: "author", label: "Author" },
          { key: "category", label: "Category" },
          { key: "isbn", label: "ISBN" },
          { key: "available", label: "Available" },
          { key: "copies", label: "Copies" },
        ]}
        rows={books.map((book) => ({
          title: book.title,
          author: book.author,
          category: book.categoryName,
          isbn: book.isbn,
          available: book.availableCopies,
          copies: book.totalCopies,
          href: `/librarian/books/${book.id}`,
        }))}
      />
    </>
  );
}
