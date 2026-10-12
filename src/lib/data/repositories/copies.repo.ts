import "server-only";
import { nextNumericCode } from "@/lib/codes";
import { makeRepo } from "@/lib/data/repo";
import type { BookCopy } from "@/types";

const repo = makeRepo<BookCopy>("book_copies");

export const copiesRepo = {
  ...repo,
  async byBook(bookId: string): Promise<BookCopy[]> {
    const rows = await repo.getAll();
    return rows.filter((row) => row.bookId === bookId);
  },
  async getAvailableCopies(bookId: string): Promise<BookCopy[]> {
    const rows = await this.byBook(bookId);
    return rows.filter((row) => row.status === "available");
  },
  async getByAccession(accessionNo: string): Promise<BookCopy | null> {
    const rows = await repo.getAll();
    const needle = accessionNo.trim().toLowerCase();
    return rows.find((row) => row.accessionNo.toLowerCase() === needle) ?? null;
  },
  async nextAccession(): Promise<string> {
    const rows = await repo.getAll();
    return nextNumericCode(
      rows.map((row) => row.accessionNo),
      "ACC",
      5,
    );
  },
};
