import Link from "next/link";

export const instant = false;
import { connection } from "next/server";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { getCurrentUser, homeForRole } from "@/lib/auth/get-current-user";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const [settings, user] = await Promise.all([settingsRepo.get(), getCurrentUser()]);
  return (
    <div className="flex min-h-full flex-col">
      <header className="no-print sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4">
          <Link href="/" className="truncate text-sm font-semibold">
            {settings.libraryName}
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" nativeButton={false} render={<Link href="/catalogue" />}>
              Catalogue
            </Button>
            <ThemeToggle />
            <Button nativeButton={false} render={<Link href={user ? homeForRole(user.role) : "/login"} />}>
              {user ? "Dashboard" : "Login"}
            </Button>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
