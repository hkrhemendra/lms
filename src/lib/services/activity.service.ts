import "server-only";
import { activityRepo } from "@/lib/data/repositories/activity.repo";

export async function logActivity(entry: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}): Promise<void> {
  await activityRepo.record(entry);
}
