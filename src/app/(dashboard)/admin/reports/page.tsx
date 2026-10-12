import { ReportView } from "@/components/reports/report-view";
import { requireRole } from "@/lib/auth/get-current-user";

export const instant = false;

export const metadata = { title: "Reports" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; from?: string; to?: string }>;
}) {
  await requireRole(["admin"]);
  const params = await searchParams;
  return <ReportView basePath="/admin/reports" report={params.report ?? "issued"} from={params.from} to={params.to} />;
}
