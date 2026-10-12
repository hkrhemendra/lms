import { PageHeader } from "@/components/layout/page-header";
import { LibrarianManager } from "@/components/settings/librarian-manager";
import { requireRole } from "@/lib/auth/get-current-user";
import { usersRepo } from "@/lib/data/repositories/users.repo";

export const instant = false;

export const metadata = { title: "Librarians" };

export default async function LibrariansPage() {
  await requireRole(["admin"]);
  const users = (await usersRepo.getAll()).filter((user) => user.role === "librarian");
  return (
    <>
      <PageHeader title="Librarians" description="Create desk accounts and block access when someone leaves." />
      <LibrarianManager users={users} />
    </>
  );
}
