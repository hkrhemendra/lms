import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { Issue } from "@/types";

const repo = makeRepo<Issue>("issues");

const ACTIVE = new Set(["issued", "overdue"]);

export const issuesRepo = {
  ...repo,
  async getActiveIssuesByMember(memberId: string): Promise<Issue[]> {
    const rows = await repo.getAll();
    return rows.filter((row) => row.memberId === memberId && ACTIVE.has(row.status));
  },
  async getByMember(memberId: string): Promise<Issue[]> {
    const rows = await repo.getAll();
    return rows.filter((row) => row.memberId === memberId);
  },
  async getActiveByCopy(copyId: string): Promise<Issue | null> {
    const rows = await repo.getAll();
    return rows.find((row) => row.copyId === copyId && ACTIVE.has(row.status)) ?? null;
  },
};
