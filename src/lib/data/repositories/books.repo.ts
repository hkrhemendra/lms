import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { Book } from "@/types";

export const booksRepo = makeRepo<Book>("books");
