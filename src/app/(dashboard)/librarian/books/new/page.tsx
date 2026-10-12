import { PageHeader } from "@/components/layout/page-header";
import { BookForm } from "@/components/books/book-form";
import { requireRole } from "@/lib/auth/get-current-user";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";

export const instant = false;

export const metadata = { title: "Add book" };

export default async function NewBookPage() {
  await requireRole(["admin", "librarian"]);
  const categories = await categoriesRepo.getAll();
  return (
    <>
      <PageHeader title="Add a book" description="Create the title, then add physical copies." />
      <BookForm categories={categories} />
    </>
  );
}
