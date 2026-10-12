import { PageHeader } from "@/components/layout/page-header";
import { DashboardCharts } from "@/components/dashboard/charts";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { ActionButton } from "@/components/shared/action-button";
import { runChecksAction } from "@/lib/actions/library";
import { requireRole } from "@/lib/auth/get-current-user";
import { getDashboard } from "@/lib/services/reports.service";

export const instant = false;

export const metadata = { title: "Admin dashboard" };

export default async function AdminHome() {
  await requireRole(["admin"]);
  const data = await getDashboard();
  return (
    <>
      <PageHeader
        title="Library overview"
        description="Rules, loans, and fines across the college."
        action={<ActionButton label="Run checks now" action={runChecksAction} />}
      />
      <KpiGrid items={data.kpis} />
      <DashboardCharts
        issuesVsReturns={data.issuesVsReturns}
        byCategory={data.byCategory}
        finesByMonth={data.finesByMonth}
        topBooks={data.topBooks}
      />
    </>
  );
}
