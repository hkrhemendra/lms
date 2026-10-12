import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cancelReservationAction } from "@/lib/actions/library";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";

export const instant = false;

export const metadata = { title: "Reservations" };

export default async function ReservationsPage() {
  await requireRole(["admin", "librarian"]);
  const [reservations, books, members, users] = await Promise.all([
    reservationsRepo.getAll(),
    booksRepo.getAll(),
    membersRepo.getAll(),
    usersRepo.getAll(),
  ]);
  const open = reservations.filter((row) => row.status === "waiting" || row.status === "ready");
  const ready = open.filter((row) => row.status === "ready");
  return (
    <>
      <PageHeader title="Reservations" description="Ready pickups are listed first. Waiting members keep their queue position." />
      <h2 className="text-lg font-medium">Ready for pickup</h2>
      <ul className="flex flex-col gap-2">
        {ready.length === 0 ? <li className="text-sm text-muted-foreground">No books are waiting at the desk.</li> : null}
        {ready.map((row) => {
          const member = members.find((item) => item.id === row.memberId);
          const user = users.find((item) => item.id === member?.userId);
          return (
            <li key={row.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{books.find((book) => book.id === row.bookId)?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.name} · hold until {formatDate(row.readyUntil)}
                </p>
              </div>
              <StatusBadge status="ready" />
            </li>
          );
        })}
      </ul>
      <h2 className="text-lg font-medium">Queues</h2>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Book</th>
              <th className="p-3 font-medium">Member</th>
              <th className="p-3 font-medium">Position</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {open.map((row) => {
              const member = members.find((item) => item.id === row.memberId);
              const user = users.find((item) => item.id === member?.userId);
              return (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{books.find((book) => book.id === row.bookId)?.title}</td>
                  <td className="p-3">{user?.name}</td>
                  <td className="p-3">{row.position}</td>
                  <td className="p-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="p-3">
                    <ActionButton label="Cancel" variant="outline" action={cancelReservationAction.bind(null, row.id)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
