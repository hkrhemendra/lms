import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatINR } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { getMemberHome } from "@/lib/services/reports.service";

export const instant = false;

export const metadata = { title: "Fines" };

export default async function MemberFinesPage() {
  const user = await requireRole(["member"]);
  const member = await membersRepo.getByUserId(user.id);
  const home = member ? await getMemberHome(member.id) : null;
  return (
    <>
      <PageHeader title="Fines" description={`Total unpaid: ${formatINR(home?.unpaid ?? 0)}. Pay at the circulation desk.`} />
      <ul className="flex flex-col gap-2">
        {(home?.fines ?? []).map((fine) => (
          <li key={fine.id} className="flex items-center justify-between gap-3 rounded-xl border p-4 text-sm">
            <span>
              {formatINR(fine.amount)} · {fine.reason} · {formatDate(fine.createdAt)}
            </span>
            <StatusBadge status={fine.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
