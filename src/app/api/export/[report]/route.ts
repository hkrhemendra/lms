import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { formatDate } from "@/lib/format";
import { todayDate } from "@/lib/dates";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { getReport, type ReportId } from "@/lib/services/reports.service";

const IDS: ReportId[] = ["issued", "overdue", "fines", "borrowed", "members", "stock", "categories"];

export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    return NextResponse.json({ message: "Staff only" }, { status: 401 });
  }
  const { report } = await context.params;
  if (!IDS.includes(report as ReportId)) {
    return NextResponse.json({ message: "Unknown report" }, { status: 404 });
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";
  const [table, settings] = await Promise.all([
    getReport(report as ReportId, from, to),
    settingsRepo.get(),
  ]);
  const range = `${from ? formatDate(from) : "Start"} – ${to ? formatDate(to) : "Today"}`;
  const stamp = `${formatDate(todayDate())} ${new Date().toISOString().slice(11, 16)} UTC`;

  if (format === "xlsx") {
    const sheet = XLSX.utils.json_to_sheet(table.rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Report");
    const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${report}.xlsx"`,
      },
    });
  }

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(settings.libraryName, 14, 16);
  doc.setFontSize(11);
  doc.text(table.title, 14, 24);
  doc.setFontSize(9);
  doc.text(`Range: ${range}`, 14, 30);
  doc.text(`Generated: ${stamp}`, 14, 35);
  autoTable(doc, {
    startY: 40,
    head: [table.columns.map((column) => column.label)],
    body: table.rows.map((row) => table.columns.map((column) => String(row[column.key] ?? ""))),
    styles: { fontSize: 8 },
    didDrawPage: () => {
      const pages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} of ${pages}`, 14, doc.internal.pageSize.getHeight() - 8);
    },
  });
  const pdf = doc.output("arraybuffer");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report}.pdf"`,
    },
  });
}
