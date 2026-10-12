import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { Notification, NotificationType } from "@/types";

const repo = makeRepo<Notification>("notifications");

export const notificationsRepo = {
  ...repo,
  async getByUser(userId: string): Promise<Notification[]> {
    const rows = await repo.getAll();
    return rows
      .filter((row) => row.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async unreadCount(userId: string): Promise<number> {
    const rows = await this.getByUser(userId);
    return rows.filter((row) => !row.read).length;
  },
  async hasRef(userId: string, type: NotificationType, refId: string): Promise<boolean> {
    const rows = await repo.getAll();
    return rows.some((row) => row.userId === userId && row.type === type && row.refId === refId);
  },
  async markRead(id: string, userId: string): Promise<void> {
    const row = await repo.getById(id);
    if (!row || row.userId !== userId) return;
    await repo.update(id, { read: true });
  },
  async markAllRead(userId: string): Promise<void> {
    const rows = await this.getByUser(userId);
    await Promise.all(rows.filter((row) => !row.read).map((row) => repo.update(row.id, { read: true })));
  },
};
