import "server-only";
import { formatINR } from "@/lib/format";
import { addDays, diffDays, todayDate } from "@/lib/dates";
import { transaction } from "@/lib/data/json-store";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { finesRepo } from "@/lib/data/repositories/fines.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { logActivity } from "@/lib/services/activity.service";
import { LibraryError } from "@/lib/services/errors";
import { notifyUser, promoteReservation } from "@/lib/services/notifications.service";
import type { Fine, Issue, ReturnCondition, Rule } from "@/types";

export type RuleCheck = { label: string; ok: boolean; detail: string };

function ruleFor(memberType: "student" | "faculty", student: Rule, faculty: Rule) {
  return memberType === "faculty" ? faculty : student;
}

async function loadIssueContext(memberId: string, copyId: string) {
  const member = await membersRepo.getById(memberId);
  const copy = await copiesRepo.getById(copyId);
  const settings = await settingsRepo.get();
  const user = member ? await usersRepo.getById(member.userId) : null;
  const book = copy ? await booksRepo.getById(copy.bookId) : null;
  const active = member ? await issuesRepo.getActiveIssuesByMember(member.id) : [];
  const unpaid = member ? await finesRepo.getUnpaidTotal(member.id) : 0;
  const ready = member && copy ? await reservationsRepo.getReadyReservation(copy.bookId, member.id) : null;
  return { member, copy, settings, user, book, active, unpaid, ready };
}

export async function evaluateIssue(memberId: string, copyId: string): Promise<{ checks: RuleCheck[]; canIssue: boolean }> {
  const { member, copy, settings, user, book, active, unpaid, ready } = await loadIssueContext(memberId, copyId);
  const today = todayDate();
  const rule = member ? ruleFor(member.memberType, settings.student, settings.faculty) : settings.student;
  const holdsSame = Boolean(book && active.some((issue) => issue.bookId === book.id));
  const copyOk =
    copy?.status === "available" || (copy?.status === "reserved" && Boolean(ready));
  const checks: RuleCheck[] = [
    {
      label: "Membership",
      ok: Boolean(member && member.status === "active" && member.validTill >= today && user?.status !== "blocked"),
      detail: !member
        ? "Member was not found."
        : member.status !== "active"
          ? "This member is inactive."
          : member.validTill < today
            ? "This membership has expired."
            : user?.status === "blocked"
              ? "This user is blocked."
              : `Active until ${member.validTill}.`,
    },
    {
      label: "Issue limit",
      ok: Boolean(member) && active.length < rule.issueLimit,
      detail: `${active.length} of ${rule.issueLimit} active loans used.`,
    },
    {
      label: "Unpaid fines",
      ok: unpaid <= settings.maxUnpaidFineToIssue,
      detail: `${formatINR(unpaid)} unpaid. Issues stop above ${formatINR(settings.maxUnpaidFineToIssue)}.`,
    },
    {
      label: "Copy",
      ok: Boolean(copyOk),
      detail: !copy
        ? "Copy was not found."
        : copy.status === "reserved" && !ready
          ? "This copy is reserved for another member."
          : copy.status === "available" || copyOk
            ? `${copy.accessionNo} can be issued.`
            : `This copy is ${copy.status}.`,
    },
    {
      label: "Already held",
      ok: !holdsSame,
      detail: holdsSame ? "This member already holds a copy of this title." : "No other copy of this title is on loan.",
    },
  ];
  return { checks, canIssue: checks.every((check) => check.ok) };
}

function assertCanIssue(checks: RuleCheck[]) {
  const failed = checks.find((check) => !check.ok);
  if (failed) throw new LibraryError(failed.detail);
}

export async function issueBook(input: { memberId: string; copyId: string; issuedBy: string }): Promise<Issue> {
  return transaction(async () => {
    const evaluation = await evaluateIssue(input.memberId, input.copyId);
    assertCanIssue(evaluation.checks);
    const member = await membersRepo.getById(input.memberId);
    const copy = await copiesRepo.getById(input.copyId);
    if (!member || !copy) throw new LibraryError("Member or copy was not found.");
    const settings = await settingsRepo.get();
    const rule = ruleFor(member.memberType, settings.student, settings.faculty);
    const today = todayDate();
    const issue: Issue = {
      id: crypto.randomUUID(),
      copyId: copy.id,
      bookId: copy.bookId,
      memberId: member.id,
      issuedBy: input.issuedBy,
      issueDate: today,
      dueDate: addDays(today, rule.loanDays),
      renewCount: 0,
      status: "issued",
    };
    await issuesRepo.create(issue);
    await copiesRepo.update(copy.id, { status: "issued" });
    const ready = await reservationsRepo.getReadyReservation(copy.bookId, member.id);
    if (ready) await reservationsRepo.update(ready.id, { status: "fulfilled" });
    const book = await booksRepo.getById(copy.bookId);
    await logActivity({
      userId: input.issuedBy,
      action: "issue",
      entity: "issue",
      entityId: issue.id,
      details: `Issued ${book?.title ?? "a book"} (${copy.accessionNo}) to ${member.memberCode}. Due ${issue.dueDate}.`,
    });
    return issue;
  });
}

export async function previewReturn(issueId: string, condition: ReturnCondition, damageAmount?: number) {
  const issue = await issuesRepo.getById(issueId);
  if (!issue || (issue.status !== "issued" && issue.status !== "overdue")) {
    throw new LibraryError("This loan is not active.");
  }
  const member = await membersRepo.getById(issue.memberId);
  const settings = await settingsRepo.get();
  if (!member) throw new LibraryError("Member was not found.");
  const rule = ruleFor(member.memberType, settings.student, settings.faculty);
  const today = todayDate();
  const daysLate = Math.max(0, diffDays(today, issue.dueDate));
  const lateFine = daysLate * rule.finePerDay;
  let extraFine = 0;
  if (condition === "damaged") extraFine = damageAmount ?? 0;
  if (condition === "lost") extraFine = settings.finePerDayLost;
  const waiting = await reservationsRepo.getWaiting(issue.bookId);
  const totalFine = lateFine + extraFine;
  let message = "No fine. The copy will become available.";
  if (condition === "good" && waiting.length > 0 && totalFine === 0) {
    message = "No fine. The copy will be held for the next person in the reservation queue.";
  } else if (condition === "good" && waiting.length > 0) {
    message = `This will create a fine of ${formatINR(totalFine)} for ${daysLate} days late, then hold the copy for the next reservation.`;
  } else if (daysLate > 0 && condition === "good") {
    message = `This will create a fine of ${formatINR(lateFine)} for ${daysLate} days late.`;
  } else if (condition === "damaged") {
    message = `This will mark the copy damaged and create a fine of ${formatINR(totalFine)}.`;
  } else if (condition === "lost") {
    message = `This will mark the book lost and create a fine of ${formatINR(totalFine)}.`;
  }
  return { daysLate, lateFine, extraFine, totalFine, message };
}

async function createFine(input: {
  issueId: string;
  memberId: string;
  amount: number;
  reason: Fine["reason"];
  actorId: string;
  bookTitle: string;
}): Promise<Fine | undefined> {
  if (input.amount <= 0) return undefined;
  const fine: Fine = {
    id: crypto.randomUUID(),
    issueId: input.issueId,
    memberId: input.memberId,
    amount: input.amount,
    reason: input.reason,
    status: "unpaid",
    createdAt: new Date().toISOString(),
  };
  await finesRepo.create(fine);
  const member = await membersRepo.getById(input.memberId);
  if (member) {
    await notifyUser({
      userId: member.userId,
      type: "fine",
      title: "Fine added",
      message: `A ${input.reason} fine of ${formatINR(input.amount)} was added for ${input.bookTitle}.`,
      refId: fine.id,
    });
  }
  await logActivity({
    userId: input.actorId,
    action: "fine",
    entity: "fine",
    entityId: fine.id,
    details: `Created a ${input.reason} fine of ${formatINR(input.amount)}.`,
  });
  return fine;
}

export async function returnBook(input: {
  issueId: string;
  condition: ReturnCondition;
  damageAmount?: number;
  actorId: string;
}): Promise<{ issue: Issue; fine?: Fine }> {
  return transaction(async () => {
    const preview = await previewReturn(input.issueId, input.condition, input.damageAmount);
    if (input.condition === "damaged" && (input.damageAmount ?? 0) <= 0) {
      throw new LibraryError("Enter the damage fine amount.");
    }
    const issue = await issuesRepo.getById(input.issueId);
    if (!issue) throw new LibraryError("Loan was not found.");
    const book = await booksRepo.getById(issue.bookId);
    const today = todayDate();
    const title = book?.title ?? "a book";
    let fine: Fine | undefined;
    if (preview.lateFine > 0) {
      fine = await createFine({
        issueId: issue.id,
        memberId: issue.memberId,
        amount: preview.lateFine,
        reason: "late",
        actorId: input.actorId,
        bookTitle: title,
      });
    }
    if (input.condition === "damaged") {
      const damage = await createFine({
        issueId: issue.id,
        memberId: issue.memberId,
        amount: input.damageAmount ?? 0,
        reason: "damaged",
        actorId: input.actorId,
        bookTitle: title,
      });
      fine = damage ?? fine;
      await copiesRepo.update(issue.copyId, { status: "damaged" });
    } else if (input.condition === "lost") {
      const lost = await createFine({
        issueId: issue.id,
        memberId: issue.memberId,
        amount: preview.extraFine,
        reason: "lost",
        actorId: input.actorId,
        bookTitle: title,
      });
      fine = lost ?? fine;
      await copiesRepo.update(issue.copyId, { status: "lost" });
    } else {
      await promoteReservation(issue.bookId, issue.copyId);
    }
    const status = input.condition === "lost" ? "lost" : "returned";
    const updated = await issuesRepo.update(issue.id, { status, returnDate: today });
    await logActivity({
      userId: input.actorId,
      action: "return",
      entity: "issue",
      entityId: issue.id,
      details: `Returned ${title} in ${input.condition} condition.`,
    });
    return { issue: updated ?? { ...issue, status, returnDate: today }, fine };
  });
}

export async function renewIssue(input: { issueId: string; actorId: string }): Promise<Issue> {
  return transaction(async () => {
    const issue = await issuesRepo.getById(input.issueId);
    if (!issue || (issue.status !== "issued" && issue.status !== "overdue")) {
      throw new LibraryError("This loan is not active.");
    }
    const today = todayDate();
    if (issue.status === "overdue" || diffDays(issue.dueDate, today) < 0) {
      throw new LibraryError("Overdue books cannot be renewed.");
    }
    const member = await membersRepo.getById(issue.memberId);
    const settings = await settingsRepo.get();
    if (!member) throw new LibraryError("Member was not found.");
    const rule = ruleFor(member.memberType, settings.student, settings.faculty);
    if (issue.renewCount >= rule.maxRenewals) {
      throw new LibraryError("This loan has reached the renewal limit.");
    }
    const queue = await reservationsRepo.getQueue(issue.bookId);
    if (queue.length > 0) {
      throw new LibraryError("Someone is waiting for this book, so it cannot be renewed.");
    }
    const dueDate = addDays(today, rule.loanDays);
    const updated = await issuesRepo.update(issue.id, {
      dueDate,
      renewCount: issue.renewCount + 1,
      status: "issued",
    });
    const book = await booksRepo.getById(issue.bookId);
    await logActivity({
      userId: input.actorId,
      action: "renew",
      entity: "issue",
      entityId: issue.id,
      details: `Renewed ${book?.title ?? "a book"}. New due date ${dueDate}.`,
    });
    return updated ?? { ...issue, dueDate, renewCount: issue.renewCount + 1 };
  });
}
