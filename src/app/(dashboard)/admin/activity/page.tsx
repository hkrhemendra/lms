import { PageHeader } from "@/components/layout/page-header";
import { SimpleTable } from "@/components/shared/simple-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/get-current-user";
import { activityRepo } from "@/lib/data/repositories/activity.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";

export const instant = false;

export const metadata = { title: "Activity" };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  const [logs, users] = await Promise.all([activityRepo.getAll(), usersRepo.getAll()]);
  const q = (params.q ?? "").toLowerCase();
  const rows = logs
    .filter((log) => {
      const day = log.createdAt.slice(0, 10);
      if (params.from && day < params.from) return false;
      if (params.to && day > params.to) return false;
      const name = users.find((user) => user.id === log.userId)?.name ?? "";
      const haystack = `${name} ${log.action} ${log.details}`.toLowerCase();
      return !q || haystack.includes(q);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((log) => ({
      when: formatDate(log.createdAt),
      who: users.find((user) => user.id === log.userId)?.name ?? "Unknown",
      action: log.action,
      details: log.details,
    }));
  return (
    <>
      <PageHeader title="Activity log" description="Every change made by staff and members." />
      <form className="flex flex-col gap-3 sm:flex-row" action="/admin/activity">
        <Input name="q" defaultValue={params.q} placeholder="Search name or action" aria-label="Search activity" />
        <Input name="from" type="date" defaultValue={params.from} aria-label="From" />
        <Input name="to" type="date" defaultValue={params.to} aria-label="To" />
        <Button type="submit">Filter</Button>
      </form>
      <SimpleTable
        columns={[
          { key: "when", label: "When" },
          { key: "who", label: "Who" },
          { key: "action", label: "Action" },
          { key: "details", label: "Details" },
        ]}
        rows={rows}
      />
    </>
  );
}
