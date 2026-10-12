import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { dueLabel, dueTone, formatDate, formatINR } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { getMemberHome } from "@/lib/services/reports.service";

export const instant = false;

export const metadata = { title: "My library" };

export default async function MemberHome() {
  const user = await requireRole(["member"]);
  const member = await membersRepo.getByUserId(user.id);
  const home = member ? await getMemberHome(member.id) : null;
  if (!home) return <p>Your membership record was not found.</p>;
  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(" ")[0]}`} description="Your loans, dues, and reservations." />
      <KpiGrid
        items={[
          { label: "Books issued", value: `${home.active.length} of ${home.rule.issueLimit}` },
          { label: "Next due", value: home.nextDue ? formatDate(home.nextDue) : "None" },
          { label: "Unpaid fines", value: formatINR(home.unpaid) },
          { label: "Reservations", value: String(home.openReservations) },
        ]}
      />
      <div className="flex flex-col gap-3">
        {home.active.length === 0 ? <p className="text-sm text-muted-foreground">You have no books out right now.</p> : null}
        {home.active.map((issue) => {
          const tone = dueTone(issue.dueDate);
          return (
            <article key={issue.id} className="flex flex-col gap-1 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium">{issue.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {issue.accessionNo} · {formatDate(issue.dueDate)} · {dueLabel(issue.dueDate)}
                </p>
              </div>
              <StatusBadge status={tone === "overdue" ? "overdue" : tone === "soon" ? "due" : "issued"} />
            </article>
          );
        })}
      </div>
      <Link href="/member/my-books" className="text-sm text-primary underline-offset-4 hover:underline">
        View history and renew
      </Link>
    </>
  );
}
