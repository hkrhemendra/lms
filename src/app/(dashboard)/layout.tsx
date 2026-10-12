import { Suspense } from "react";

export const instant = false;
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CommandMenu } from "@/components/layout/command-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser, hasSessionCookie } from "@/lib/auth/get-current-user";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { notificationsRepo } from "@/lib/data/repositories/notifications.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { navFor } from "@/lib/nav";
import { runDailyChecks } from "@/lib/services/notifications.service";

async function DashboardShell({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    if (await hasSessionCookie()) redirect("/logout");
    redirect("/login");
  }
  await runDailyChecks(user.id);
  const [settings, notes, books] = await Promise.all([
    settingsRepo.get(),
    notificationsRepo.getByUser(user.id),
    booksRepo.getAll(),
  ]);
  const staff = user.role !== "member";
  const members = staff ? await membersRepo.getAll() : [];
  const users = staff ? await usersRepo.getAll() : [];
  const pages = navFor(user.role).flatMap((group) => group.items);

  return (
    <SidebarProvider>
      <AppSidebar role={user.role} libraryName={settings.libraryName} />
      <SidebarInset>
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3">
          <SidebarTrigger />
          <CommandMenu
            pages={pages}
            books={books.map((book) => ({ id: book.id, title: book.title, href: `/catalogue/${book.id}` }))}
            members={members.map((member) => ({
              id: member.id,
              name: `${users.find((row) => row.id === member.userId)?.name ?? member.memberCode} · ${member.memberCode}`,
              href: `/librarian/members/${member.id}`,
            }))}
          />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell
              items={notes.slice(0, 6)}
              unread={notes.filter((note) => !note.read).length}
              href={user.role === "member" ? "/member/notifications" : "/admin/activity"}
            />
            <ThemeToggle />
            <UserMenu
              name={user.name}
              email={user.email}
              profileHref={user.role === "member" ? "/member/profile" : undefined}
            />
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
