import "server-only";
import { nextNumericCode } from "@/lib/codes";
import { stampCompact, todayDate } from "@/lib/dates";
import { makeRepo } from "@/lib/data/repo";
import type { Fine } from "@/types";

const repo = makeRepo<Fine>("fines");

export const finesRepo = {
  ...repo,
  async getByMember(memberId: string): Promise<Fine[]> {
    const rows = await repo.getAll();
    return rows.filter((row) => row.memberId === memberId);
  },
  async getUnpaidTotal(memberId: string): Promise<number> {
    const rows = await this.getByMember(memberId);
    return rows.filter((row) => row.status === "unpaid").reduce((sum, row) => sum + row.amount, 0);
  },
  async nextReceiptNo(): Promise<string> {
    const rows = await repo.getAll();
    return nextNumericCode(
      rows.map((row) => row.receiptNo ?? ""),
      `RCPT-${stampCompact(todayDate())}`,
      4,
    );
  },
};
