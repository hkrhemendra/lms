import "server-only";
import { addDays, diffDays, todayDate } from "@/lib/dates";
import { transaction } from "@/lib/data/json-store";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { notificationsRepo } from "@/lib/data/repositories/notifications.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { logActivity } from "@/lib/services/activity.service";
import type { Notification } from "@/types";

async function notify(input: Omit<Notification, "id" | "read" | "createdAt">): Promise<void> {
  if (input.refId && (await notificationsRepo.hasRef(input.userId, input.type, input.refId))) return;
  await notificationsRepo.create({
    ...input,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export async function notifyUser(input: Omit<Notification, "id" | "read" | "createdAt">): Promise<void> {
  await notify(input);
}

export async function promoteReservation(bookId: string, copyId: string): Promise<void> {
  const settings = await settingsRepo.get();
  const waiting = await reservationsRepo.getWaiting(bookId);
  const next = waiting[0];
  if (!next) {
    await copiesRepo.update(copyId, { status: "available" });
    return;
  }
  const today = todayDate();
  const readyUntil = addDays(today, settings.reservationHoldDays);
  await reservationsRepo.update(next.id, { status: "ready", readyUntil, position: 0 });
  await copiesRepo.update(copyId, { status: "reserved" });
  const rest = waiting.slice(1);
  for (let index = 0; index < rest.length; index += 1) {
    await reservationsRepo.update(rest[index].id, { position: index + 1 });
  }
  const member = await membersRepo.getById(next.memberId);
  const book = await booksRepo.getById(bookId);
  if (!member) return;
  await notify({
    userId: member.userId,
    type: "reservation_ready",
    title: "Reservation ready",
    message: `${book?.title ?? "Your reserved book"} is ready for pickup until ${readyUntil}.`,
    refId: next.id,
  });
}

export async function releaseReadyHold(bookId: string): Promise<void> {
  const copy = (await copiesRepo.byBook(bookId)).find((row) => row.status === "reserved");
  if (!copy) return;
  await promoteReservation(bookId, copy.id);
}

async function runChecks(actorId?: string): Promise<{
  markedOverdue: number;
  notifications: number;
  expiredReservations: number;
}> {
  const today = todayDate();
  const settings = await settingsRepo.get();
  let markedOverdue = 0;
  let notifications = 0;
  let expiredReservations = 0;
  const before = (await notificationsRepo.getAll()).length;

  const issues = await issuesRepo.getAll();
  for (const issue of issues) {
    if (issue.status !== "issued" && issue.status !== "overdue") continue;
    const member = await membersRepo.getById(issue.memberId);
    const book = await booksRepo.getById(issue.bookId);
    if (!member || !book) continue;
    const days = diffDays(issue.dueDate, today);
    if (days < 0 && issue.status !== "overdue") {
      await issuesRepo.update(issue.id, { status: "overdue" });
      markedOverdue += 1;
    }
    if (days < 0) {
      await notify({
        userId: member.userId,
        type: "overdue",
        title: "Book overdue",
        message: `${book.title} is overdue. Please return it to avoid further fines.`,
        refId: issue.id,
      });
    } else if (days === 1 || days === 2) {
      await notify({
        userId: member.userId,
        type: "due_soon",
        title: "Book due soon",
        message: `${book.title} is due on ${issue.dueDate}.`,
        refId: issue.id,
      });
    }
  }

  const reservations = await reservationsRepo.getAll();
  for (const reservation of reservations) {
    if (reservation.status !== "ready" || !reservation.readyUntil) continue;
    if (diffDays(reservation.readyUntil, today) >= 0) continue;
    await reservationsRepo.update(reservation.id, { status: "expired" });
    expiredReservations += 1;
    await releaseReadyHold(reservation.bookId);
  }

  await settingsRepo.update({ lastCheckedAt: today });
  const after = (await notificationsRepo.getAll()).length;
  notifications = after - before;
  if (actorId) {
    await logActivity({
      userId: actorId,
      action: "daily_check",
      entity: "settings",
      entityId: "settings",
      details: `Marked ${markedOverdue} overdue, expired ${expiredReservations} reservations, sent ${notifications} notices.`,
    });
  }
  return { markedOverdue, notifications, expiredReservations };
}

export async function runDailyChecks(actorId?: string): Promise<{
  markedOverdue: number;
  notifications: number;
  expiredReservations: number;
}> {
  return transaction(async () => {
    const settings = await settingsRepo.get();
    if (settings.lastCheckedAt === todayDate()) {
      return { markedOverdue: 0, notifications: 0, expiredReservations: 0 };
    }
    return runChecks(actorId);
  });
}

export async function forceDailyChecks(actorId: string) {
  return transaction(() => runChecks(actorId));
}
