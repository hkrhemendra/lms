import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { Reservation } from "@/types";

const repo = makeRepo<Reservation>("reservations");

export const reservationsRepo = {
  ...repo,
  async getQueue(bookId: string): Promise<Reservation[]> {
    const rows = await repo.getAll();
    return rows
      .filter((row) => row.bookId === bookId && (row.status === "waiting" || row.status === "ready"))
      .sort((a, b) => a.position - b.position || a.requestDate.localeCompare(b.requestDate));
  },
  async getWaiting(bookId: string): Promise<Reservation[]> {
    const queue = await this.getQueue(bookId);
    return queue.filter((row) => row.status === "waiting").sort((a, b) => a.position - b.position);
  },
  async getReadyReservation(bookId: string, memberId: string): Promise<Reservation | null> {
    const rows = await repo.getAll();
    return (
      rows.find((row) => row.bookId === bookId && row.memberId === memberId && row.status === "ready") ??
      null
    );
  },
  async getByMember(memberId: string): Promise<Reservation[]> {
    const rows = await repo.getAll();
    return rows.filter((row) => row.memberId === memberId);
  },
};
