import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SimpleTable } from "@/components/shared/simple-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReport, REPORTS, type ReportId } from "@/lib/services/reports.service";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";

export async function ReportView({
  basePath,
  report,
  from,
  to,
}: {
  basePath: string;
  report: string;
  from?: string;
  to?: string;
}) {
  const selected = REPORTS.some((item) => item.id === report) ? (report as ReportId) : "issued";
  const [table, settings] = await Promise.all([getReport(selected, from, to), settingsRepo.get()]);
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const suffix = query.toString();

  return (
    <>
      <PageHeader title="Reports" description={`${settings.libraryName} — export any report as PDF or Excel.`} />
      <div className="flex flex-wrap gap-2">
        {REPORTS.map((item) => (
          <Button key={item.id} variant={item.id === selected ? "default" : "outline"} size="sm" nativeButton={false} render={<Link href={`${basePath}?report=${item.id}${suffix ? `&${suffix}` : ""}`} />}>
            {item.title}
          </Button>
        ))}
      </div>
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" action={basePath}>
        <input type="hidden" name="report" value={selected} />
        <label className="flex flex-col gap-1 text-sm">
          From
          <Input type="date" name="from" defaultValue={from} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <Input type="date" name="to" defaultValue={to} />
        </label>
        <Button type="submit">Apply</Button>
        <Button variant="outline" nativeButton={false} render={<a href={`/api/export/${selected}?format=pdf&from=${from ?? ""}&to=${to ?? ""}`} />}>
          Export PDF
        </Button>
        <Button variant="outline" nativeButton={false} render={<a href={`/api/export/${selected}?format=xlsx&from=${from ?? ""}&to=${to ?? ""}`} />}>
          Export Excel
        </Button>
      </form>
      <div className="print-report">
        <SimpleTable columns={table.columns} rows={table.rows} searchPlaceholder={`Search ${table.title}`} />
      </div>
    </>
  );
}
