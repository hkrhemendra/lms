import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { ActivityLog } from "@/types";

const repo = makeRepo<ActivityLog>("activity_log");

export const activityRepo = {
  ...repo,
  async record(entry: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
    await repo.create({
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  },
};
