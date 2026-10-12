import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { renewIssueAction } from "@/lib/actions/library";
import { dueLabel, dueTone, formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { getMemberHome } from "@/lib/services/reports.service";

export const instant = false;

export const metadata = { title: "My books" };

export default async function MyBooksPage() {
  const user = await requireRole(["member"]);
  const member = await membersRepo.getByUserId(user.id);
  const home = member ? await getMemberHome(member.id) : null;
  if (!home) return null;
  return (
    <>
      <PageHeader title="My books" description="Renew a loan when it is not overdue and nobody is waiting." />
      <div className="flex flex-col gap-3">
        {home.active.map((issue) => (
          <article key={issue.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-medium">{issue.title}</h2>
              <p className="text-sm text-muted-foreground">
                Due {formatDate(issue.dueDate)} · {dueLabel(issue.dueDate)} · renewed {issue.renewCount} times
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={dueTone(issue.dueDate) === "overdue" ? "overdue" : dueTone(issue.dueDate) === "soon" ? "due" : "issued"} />
              <ActionButton label="Renew" disabled={!issue.canRenew} action={renewIssueAction.bind(null, issue.id)} />
            </div>
          </article>
        ))}
      </div>
      <h2 className="text-lg font-medium">History</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {home.history.map((issue) => (
          <li key={issue.id} className="flex justify-between gap-3 border-b py-2">
            <span>{issue.title}</span>
            <span className="text-muted-foreground">
              {formatDate(issue.issueDate)} – {formatDate(issue.returnDate)} · {issue.status}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
