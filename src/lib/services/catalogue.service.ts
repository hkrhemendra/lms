import "server-only";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { logActivity } from "@/lib/services/activity.service";
import { LibraryError } from "@/lib/services/errors";
import type { Book, BookCopy, Category } from "@/types";

export type BookSummary = Book & {
  categoryName: string;
  totalCopies: number;
  availableCopies: number;
};

async function withCounts(books: Book[], categories: Category[], copies: BookCopy[]): Promise<BookSummary[]> {
  return books
    .map((book) => {
      const own = copies.filter((copy) => copy.bookId === book.id);
      return {
        ...book,
        categoryName: categories.find((category) => category.id === book.categoryId)?.name ?? "Uncategorised",
        totalCopies: own.length,
        availableCopies: own.filter((copy) => copy.status === "available").length,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function listBookSummaries(): Promise<BookSummary[]> {
  const [books, categories, copies] = await Promise.all([
    booksRepo.getAll(),
    categoriesRepo.getAll(),
    copiesRepo.getAll(),
  ]);
  return withCounts(books, categories, copies);
}

export async function getBookSummary(id: string): Promise<BookSummary | null> {
  const books = await listBookSummaries();
  return books.find((book) => book.id === id) ?? null;
}

export async function saveCategory(
  input: { name: string; description?: string },
  actorId: string,
  id?: string,
): Promise<Category> {
  if (id) {
    const updated = await categoriesRepo.update(id, {
      name: input.name,
      description: input.description || undefined,
    });
    if (!updated) throw new LibraryError("Category was not found.");
    await logActivity({
      userId: actorId,
      action: "update_category",
      entity: "category",
      entityId: id,
      details: `Updated category ${input.name}.`,
    });
    return updated;
  }
  const category: Category = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description || undefined,
  };
  await categoriesRepo.create(category);
  await logActivity({
    userId: actorId,
    action: "create_category",
    entity: "category",
    entityId: category.id,
    details: `Created category ${category.name}.`,
  });
  return category;
}

export async function deleteCategory(id: string, actorId: string) {
  const books = await booksRepo.getAll();
  if (books.some((book) => book.categoryId === id)) {
    throw new LibraryError("Move or delete the books in this category first.");
  }
  const category = await categoriesRepo.getById(id);
  await categoriesRepo.remove(id);
  await logActivity({
    userId: actorId,
    action: "delete_category",
    entity: "category",
    entityId: id,
    details: `Deleted category ${category?.name ?? id}.`,
  });
}

export async function saveBook(
  input: Omit<Book, "id" | "createdAt">,
  actorId: string,
  id?: string,
): Promise<Book> {
  if (id) {
    const updated = await booksRepo.update(id, input);
    if (!updated) throw new LibraryError("Book was not found.");
    await logActivity({
      userId: actorId,
      action: "update_book",
      entity: "book",
      entityId: id,
      details: `Updated ${input.title}.`,
    });
    return updated;
  }
  const book: Book = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await booksRepo.create(book);
  await logActivity({
    userId: actorId,
    action: "create_book",
    entity: "book",
    entityId: book.id,
    details: `Added ${book.title}.`,
  });
  return book;
}

export async function deleteBook(id: string, actorId: string) {
  const copies = await copiesRepo.byBook(id);
  if (copies.some((copy) => copy.status === "issued" || copy.status === "reserved")) {
    throw new LibraryError("Return issued copies and clear reservations before deleting this book.");
  }
  const book = await booksRepo.getById(id);
  for (const copy of copies) await copiesRepo.remove(copy.id);
  await booksRepo.remove(id);
  await logActivity({
    userId: actorId,
    action: "delete_book",
    entity: "book",
    entityId: id,
    details: `Deleted ${book?.title ?? "a book"}.`,
  });
}

export async function addCopy(bookId: string, rackNo: string, actorId: string): Promise<BookCopy> {
  const book = await booksRepo.getById(bookId);
  if (!book) throw new LibraryError("Book was not found.");
  const copy: BookCopy = {
    id: crypto.randomUUID(),
    bookId,
    accessionNo: await copiesRepo.nextAccession(),
    rackNo,
    status: "available",
    addedAt: new Date().toISOString(),
  };
  await copiesRepo.create(copy);
  await logActivity({
    userId: actorId,
    action: "add_copy",
    entity: "book_copy",
    entityId: copy.id,
    details: `Added ${copy.accessionNo} for ${book.title}.`,
  });
  return copy;
}

export async function updateCopy(
  id: string,
  patch: { rackNo?: string; status?: "available" | "lost" | "damaged" },
  actorId: string,
) {
  const copy = await copiesRepo.getById(id);
  if (!copy) throw new LibraryError("Copy was not found.");
  if (patch.status && (copy.status === "issued" || copy.status === "reserved")) {
    throw new LibraryError("Return this copy before changing its condition.");
  }
  const updated = await copiesRepo.update(id, patch);
  await logActivity({
    userId: actorId,
    action: "update_copy",
    entity: "book_copy",
    entityId: id,
    details: `Updated ${copy.accessionNo}.`,
  });
  return updated;
}
