import "server-only";
import { format, parseISO } from "date-fns";
import { diffDays, todayDate } from "@/lib/dates";
import { formatDate, formatINR } from "@/lib/format";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { finesRepo } from "@/lib/data/repositories/fines.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import type { Member } from "@/types";

export type ReportId =
  | "issued"
  | "overdue"
  | "fines"
  | "borrowed"
  | "members"
  | "stock"
  | "categories";

export type ReportTable = {
  id: ReportId;
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
};

export const REPORTS: { id: ReportId; title: string; description: string }[] = [
  { id: "issued", title: "Currently issued books", description: "Books that are out with members." },
  { id: "overdue", title: "Overdue books", description: "Loans past their due date and the fine so far." },
  { id: "fines", title: "Fine collection", description: "Paid, unpaid, and waived fines." },
  { id: "borrowed", title: "Most-borrowed books", description: "Titles ranked by how often they are issued." },
  { id: "members", title: "Member borrowing history", description: "Every loan in the selected period." },
  { id: "stock", title: "Stock report", description: "Copies grouped by condition." },
  { id: "categories", title: "Category distribution", description: "Titles and copies in each category." },
];

function inRange(date: string | undefined, from?: string, to?: string) {
  if (!date) return !from && !to;
  const day = date.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function lastSixMonths() {
  const [year, month] = todayDate().split("-").map(Number);
  return Array.from({ length: 6 }, (_, index) => {
    const cursor = new Date(Date.UTC(year, month - 1 - (5 - index), 1));
    const key = cursor.toISOString().slice(0, 7);
    return { key, label: format(parseISO(`${key}-01`), "MMM yyyy") };
  });
}

function ruleFor(member: Member, settings: Awaited<ReturnType<typeof settingsRepo.get>>) {
  return member.memberType === "faculty" ? settings.faculty : settings.student;
}

export async function getDashboard() {
  const [books, copies, issues, members, fines, categories, settings] = await Promise.all([
    booksRepo.getAll(),
    copiesRepo.getAll(),
    issuesRepo.getAll(),
    membersRepo.getAll(),
    finesRepo.getAll(),
    categoriesRepo.getAll(),
    settingsRepo.get(),
  ]);
  const today = todayDate();
  const month = today.slice(0, 7);
  const overdue = issues.filter(
    (issue) => (issue.status === "issued" || issue.status === "overdue") && issue.dueDate < today,
  );
  const collected = fines
    .filter((fine) => fine.status === "paid" && fine.paidDate?.startsWith(month))
    .reduce((sum, fine) => sum + fine.amount, 0);
  const unpaid = fines.filter((fine) => fine.status === "unpaid").reduce((sum, fine) => sum + fine.amount, 0);
  const months = lastSixMonths();
  const issuesVsReturns = months.map((item) => ({
    month: item.label,
    issues: issues.filter((issue) => monthKey(issue.issueDate) === item.key).length,
    returns: issues.filter((issue) => issue.returnDate && monthKey(issue.returnDate) === item.key).length,
  }));
  const byCategory = categories.map((category) => ({
    name: category.name,
    count: books.filter((book) => book.categoryId === category.id).length,
  }));
  const finesByMonth = months.map((item) => ({
    month: item.label,
    amount: fines
      .filter((fine) => fine.status === "paid" && fine.paidDate && monthKey(fine.paidDate) === item.key)
      .reduce((sum, fine) => sum + fine.amount, 0),
  }));
  const counts = new Map<string, number>();
  for (const issue of issues) counts.set(issue.bookId, (counts.get(issue.bookId) ?? 0) + 1);
  const topBooks = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([bookId, count]) => ({
      title: books.find((book) => book.id === bookId)?.title ?? "Unknown",
      count,
    }));

  return {
    libraryName: settings.libraryName,
    kpis: [
      { label: "Titles", value: String(books.length) },
      { label: "Copies", value: String(copies.length) },
      { label: "Available", value: String(copies.filter((copy) => copy.status === "available").length) },
      { label: "Issued", value: String(copies.filter((copy) => copy.status === "issued").length) },
      { label: "Overdue", value: String(overdue.length) },
      { label: "Members", value: String(members.length) },
      { label: "Unpaid fines", value: formatINR(unpaid) },
      { label: "Collected this month", value: formatINR(collected) },
    ],
    issuesVsReturns,
    byCategory,
    finesByMonth,
    topBooks,
    overdueCount: overdue.length,
    pendingReservations: (await reservationsRepo.getAll()).filter(
      (row) => row.status === "waiting" || row.status === "ready",
    ).length,
  };
}

export async function getLibrarianToday() {
  const issues = await issuesRepo.getAll();
  const today = todayDate();
  const reservations = await reservationsRepo.getAll();
  return {
    issuedToday: issues.filter((issue) => issue.issueDate === today).length,
    returnedToday: issues.filter((issue) => issue.returnDate === today).length,
    overdue: issues.filter(
      (issue) => (issue.status === "issued" || issue.status === "overdue") && issue.dueDate < today,
    ).length,
    pendingReservations: reservations.filter((row) => row.status === "waiting" || row.status === "ready").length,
  };
}

export async function getMemberHome(memberId: string) {
  const member = await membersRepo.getById(memberId);
  if (!member) return null;
  const [issues, books, fines, reservations, settings, copies] = await Promise.all([
    issuesRepo.getByMember(memberId),
    booksRepo.getAll(),
    finesRepo.getByMember(memberId),
    reservationsRepo.getByMember(memberId),
    settingsRepo.get(),
    copiesRepo.getAll(),
  ]);
  const today = todayDate();
  const rule = ruleFor(member, settings);
  const active = await Promise.all(
    issues
      .filter((issue) => issue.status === "issued" || issue.status === "overdue")
      .map(async (issue) => {
        const queue = await reservationsRepo.getQueue(issue.bookId);
        return {
          ...issue,
          title: books.find((book) => book.id === issue.bookId)?.title ?? "Book",
          accessionNo: copies.find((copy) => copy.id === issue.copyId)?.accessionNo ?? "",
          canRenew:
            issue.status === "issued" &&
            issue.dueDate >= today &&
            issue.renewCount < rule.maxRenewals &&
            queue.length === 0,
        };
      }),
  );
  active.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const history = issues
    .filter((issue) => issue.status === "returned" || issue.status === "lost")
    .map((issue) => ({
      ...issue,
      title: books.find((book) => book.id === issue.bookId)?.title ?? "Book",
    }));
  const unpaid = fines.filter((fine) => fine.status === "unpaid").reduce((sum, fine) => sum + fine.amount, 0);
  const openReservations = reservations.filter((row) => row.status === "waiting" || row.status === "ready");
  return {
    member,
    rule,
    active,
    history,
    fines,
    unpaid,
    reservations: reservations.map((row) => ({
      ...row,
      title: books.find((book) => book.id === row.bookId)?.title ?? "Book",
    })),
    openReservations: openReservations.length,
    nextDue: active[0]?.dueDate,
  };
}

export async function getReport(id: ReportId, from?: string, to?: string): Promise<ReportTable> {
  const [books, copies, issues, members, fines, categories, users, settings] = await Promise.all([
    booksRepo.getAll(),
    copiesRepo.getAll(),
    issuesRepo.getAll(),
    membersRepo.getAll(),
    finesRepo.getAll(),
    categoriesRepo.getAll(),
    usersRepo.getAll(),
    settingsRepo.get(),
  ]);
  const today = todayDate();
  const bookTitle = (bookId: string) => books.find((book) => book.id === bookId)?.title ?? "Unknown";
  const memberName = (memberId: string) => {
    const member = members.find((row) => row.id === memberId);
    const user = users.find((row) => row.id === member?.userId);
    return user ? `${user.name} (${member?.memberCode})` : "Unknown";
  };

  if (id === "issued") {
    const rows = issues
      .filter((issue) => (issue.status === "issued" || issue.status === "overdue") && inRange(issue.issueDate, from, to))
      .map((issue) => ({
        member: memberName(issue.memberId),
        book: bookTitle(issue.bookId),
        accession: copies.find((copy) => copy.id === issue.copyId)?.accessionNo ?? "",
        issued: formatDate(issue.issueDate),
        due: formatDate(issue.dueDate),
        status: issue.status,
      }));
    return {
      id,
      title: "Currently issued books",
      columns: [
        { key: "member", label: "Member" },
        { key: "book", label: "Book" },
        { key: "accession", label: "Accession" },
        { key: "issued", label: "Issued" },
        { key: "due", label: "Due" },
        { key: "status", label: "Status" },
      ],
      rows,
    };
  }

  if (id === "overdue") {
    const rows = issues
      .filter((issue) => (issue.status === "issued" || issue.status === "overdue") && issue.dueDate < today && inRange(issue.dueDate, from, to))
      .map((issue) => {
        const member = members.find((row) => row.id === issue.memberId);
        const rate = member ? ruleFor(member, settings).finePerDay : 0;
        const days = diffDays(today, issue.dueDate);
        return {
          member: memberName(issue.memberId),
          book: bookTitle(issue.bookId),
          days,
          fine: formatINR(days * rate),
          due: formatDate(issue.dueDate),
        };
      });
    return {
      id,
      title: "Overdue books",
      columns: [
        { key: "member", label: "Member" },
        { key: "book", label: "Book" },
        { key: "due", label: "Due" },
        { key: "days", label: "Days overdue" },
        { key: "fine", label: "Fine so far" },
      ],
      rows,
    };
  }

  if (id === "fines") {
    const rows = fines
      .filter((fine) => inRange(fine.paidDate ?? fine.createdAt, from, to))
      .map((fine) => ({
        member: memberName(fine.memberId),
        amount: formatINR(fine.amount),
        reason: fine.reason,
        status: fine.status,
        date: formatDate(fine.paidDate ?? fine.createdAt),
        receipt: fine.receiptNo ?? "",
      }));
    return {
      id,
      title: "Fine collection",
      columns: [
        { key: "member", label: "Member" },
        { key: "amount", label: "Amount" },
        { key: "reason", label: "Reason" },
        { key: "status", label: "Status" },
        { key: "date", label: "Date" },
        { key: "receipt", label: "Receipt" },
      ],
      rows,
    };
  }

  if (id === "borrowed") {
    const scoped = issues.filter((issue) => inRange(issue.issueDate, from, to));
    const counts = new Map<string, number>();
    for (const issue of scoped) counts.set(issue.bookId, (counts.get(issue.bookId) ?? 0) + 1);
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([bookId, count], index) => ({
        rank: index + 1,
        book: bookTitle(bookId),
        loans: count,
      }));
    return {
      id,
      title: "Most-borrowed books",
      columns: [
        { key: "rank", label: "Rank" },
        { key: "book", label: "Book" },
        { key: "loans", label: "Loans" },
      ],
      rows,
    };
  }

  if (id === "members") {
    const rows = issues
      .filter((issue) => inRange(issue.issueDate, from, to))
      .map((issue) => ({
        member: memberName(issue.memberId),
        book: bookTitle(issue.bookId),
        issued: formatDate(issue.issueDate),
        due: formatDate(issue.dueDate),
        returned: formatDate(issue.returnDate),
        status: issue.status,
      }));
    return {
      id,
      title: "Member borrowing history",
      columns: [
        { key: "member", label: "Member" },
        { key: "book", label: "Book" },
        { key: "issued", label: "Issued" },
        { key: "due", label: "Due" },
        { key: "returned", label: "Returned" },
        { key: "status", label: "Status" },
      ],
      rows,
    };
  }

  if (id === "stock") {
    const rows = copies
      .filter((copy) => inRange(copy.addedAt, from, to))
      .map((copy) => ({
        accession: copy.accessionNo,
        book: bookTitle(copy.bookId),
        rack: copy.rackNo,
        status: copy.status,
      }));
    return {
      id,
      title: "Stock report",
      columns: [
        { key: "accession", label: "Accession" },
        { key: "book", label: "Book" },
        { key: "rack", label: "Rack" },
        { key: "status", label: "Status" },
      ],
      rows,
    };
  }

  const rows = categories.map((category) => {
    const titles = books.filter((book) => book.categoryId === category.id);
    const ownCopies = copies.filter((copy) => titles.some((book) => book.id === copy.bookId));
    return {
      category: category.name,
      titles: titles.length,
      copies: ownCopies.length,
      available: ownCopies.filter((copy) => copy.status === "available").length,
    };
  });
  return {
    id: "categories",
    title: "Category distribution",
    columns: [
      { key: "category", label: "Category" },
      { key: "titles", label: "Titles" },
      { key: "copies", label: "Copies" },
      { key: "available", label: "Available" },
    ],
    rows,
  };
}
