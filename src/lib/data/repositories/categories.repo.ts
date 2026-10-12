import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { Category } from "@/types";

export const categoriesRepo = makeRepo<Category>("categories");
