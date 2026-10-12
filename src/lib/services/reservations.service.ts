import "server-only";
import { todayDate } from "@/lib/dates";
import { transaction } from "@/lib/data/json-store";
import { booksRepo } from "@/lib/data/repositories/books.repo";
import { copiesRepo } from "@/lib/data/repositories/copies.repo";
import { issuesRepo } from "@/lib/data/repositories/issues.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { reservationsRepo } from "@/lib/data/repositories/reservations.repo";
import { logActivity } from "@/lib/services/activity.service";
import { LibraryError } from "@/lib/services/errors";
import { releaseReadyHold } from "@/lib/services/notifications.service";
import type { Reservation } from "@/types";

export async function reserveBook(input: { memberId: string; bookId: string }): Promise<Reservation> {
  return transaction(async () => {
    const member = await membersRepo.getById(input.memberId);
    const book = await booksRepo.getById(input.bookId);
    if (!member || !book) throw new LibraryError("Member or book was not found.");
    const today = todayDate();
    if (member.status !== "active" || member.validTill < today) {
      throw new LibraryError("Only active members can reserve books.");
    }
    const available = await copiesRepo.getAvailableCopies(book.id);
    if (available.length > 0) {
      throw new LibraryError("A copy is available. Ask the desk to issue it instead of reserving.");
    }
    const active = await issuesRepo.getActiveIssuesByMember(member.id);
    if (active.some((issue) => issue.bookId === book.id)) {
      throw new LibraryError("You already hold this book.");
    }
    const queue = await reservationsRepo.getQueue(book.id);
    if (queue.some((row) => row.memberId === member.id)) {
      throw new LibraryError("You already have a reservation for this book.");
    }
    const waiting = queue.filter((row) => row.status === "waiting");
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      bookId: book.id,
      memberId: member.id,
      requestDate: today,
      status: "waiting",
      position: waiting.length + 1,
    };
    await reservationsRepo.create(reservation);
    await logActivity({
      userId: member.userId,
      action: "reserve",
      entity: "reservation",
      entityId: reservation.id,
      details: `Reserved ${book.title}. Queue position ${reservation.position}.`,
    });
    return reservation;
  });
}

export async function cancelReservation(input: { reservationId: string; actorId: string }): Promise<Reservation> {
  return transaction(async () => {
    const reservation = await reservationsRepo.getById(input.reservationId);
    if (!reservation || (reservation.status !== "waiting" && reservation.status !== "ready")) {
      throw new LibraryError("This reservation cannot be cancelled.");
    }
    const updated = await reservationsRepo.update(reservation.id, { status: "cancelled" });
    const waiting = (await reservationsRepo.getWaiting(reservation.bookId)).filter((row) => row.id !== reservation.id);
    for (let index = 0; index < waiting.length; index += 1) {
      await reservationsRepo.update(waiting[index].id, { position: index + 1 });
    }
    if (reservation.status === "ready") await releaseReadyHold(reservation.bookId);
    const book = await booksRepo.getById(reservation.bookId);
    await logActivity({
      userId: input.actorId,
      action: "cancel_reservation",
      entity: "reservation",
      entityId: reservation.id,
      details: `Cancelled reservation for ${book?.title ?? "a book"}.`,
    });
    return updated ?? { ...reservation, status: "cancelled" };
  });
}
