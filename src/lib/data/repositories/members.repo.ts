import "server-only";
import { nextNumericCode } from "@/lib/codes";
import { todayDate } from "@/lib/dates";
import { makeRepo } from "@/lib/data/repo";
import type { Member } from "@/types";

const repo = makeRepo<Member>("members");

export const membersRepo = {
  ...repo,
  async getByUserId(userId: string): Promise<Member | null> {
    const rows = await repo.getAll();
    return rows.find((row) => row.userId === userId) ?? null;
  },
  async nextCode(): Promise<string> {
    const rows = await repo.getAll();
    const year = todayDate().slice(0, 4);
    return nextNumericCode(
      rows.map((row) => row.memberCode),
      `MEM-${year}`,
      3,
    );
  },
};
