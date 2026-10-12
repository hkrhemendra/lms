import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { cancelReservationAction } from "@/lib/actions/library";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { getMemberHome } from "@/lib/services/reports.service";

export const instant = false;

export const metadata = { title: "Reservations" };

export default async function MemberReservationsPage() {
  const user = await requireRole(["member"]);
  const member = await membersRepo.getByUserId(user.id);
  const home = member ? await getMemberHome(member.id) : null;
  const rows = home?.reservations.filter((row) => row.status === "waiting" || row.status === "ready") ?? [];
  return (
    <>
      <PageHeader title="Reservations" description="Your place in each queue. Cancel if you no longer need the book." />
      <ul className="flex flex-col gap-3">
        {rows.length === 0 ? <li className="text-sm text-muted-foreground">You have no active reservations.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{row.title}</p>
              <p className="text-sm text-muted-foreground">
                {row.status === "ready" ? `Ready until ${formatDate(row.readyUntil)}` : `Queue position ${row.position}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={row.status} />
              <ActionButton label="Cancel" variant="outline" action={cancelReservationAction} id={row.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
