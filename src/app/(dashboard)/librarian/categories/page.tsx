import { CategoryManager } from "@/components/books/category-manager";
import { requireRole } from "@/lib/auth/get-current-user";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";

export const instant = false;

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireRole(["admin", "librarian"]);
  const categories = await categoriesRepo.getAll();
  return <CategoryManager categories={categories} />;
}
