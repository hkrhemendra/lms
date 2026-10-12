import "server-only";
import { todayDate } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { transaction } from "@/lib/data/json-store";
import { finesRepo } from "@/lib/data/repositories/fines.repo";
import { logActivity } from "@/lib/services/activity.service";
import { LibraryError } from "@/lib/services/errors";
import type { Fine } from "@/types";

export async function markFinePaid(input: { fineId: string; actorId: string }): Promise<Fine> {
  return transaction(async () => {
    const fine = await finesRepo.getById(input.fineId);
    if (!fine) throw new LibraryError("Fine was not found.");
    if (fine.status !== "unpaid") throw new LibraryError("Only unpaid fines can be marked paid.");
    const receiptNo = await finesRepo.nextReceiptNo();
    const updated = await finesRepo.update(fine.id, {
      status: "paid",
      paidDate: todayDate(),
      receiptNo,
    });
    await logActivity({
      userId: input.actorId,
      action: "pay_fine",
      entity: "fine",
      entityId: fine.id,
      details: `Marked ${formatINR(fine.amount)} paid. Receipt ${receiptNo}.`,
    });
    return updated ?? { ...fine, status: "paid", paidDate: todayDate(), receiptNo };
  });
}

export async function waiveFine(input: { fineId: string; reason: string; actorId: string }): Promise<Fine> {
  return transaction(async () => {
    const reason = input.reason.trim();
    if (reason.length < 3) throw new LibraryError("A reason is required to waive a fine.");
    const fine = await finesRepo.getById(input.fineId);
    if (!fine) throw new LibraryError("Fine was not found.");
    if (fine.status !== "unpaid") throw new LibraryError("Only unpaid fines can be waived.");
    const updated = await finesRepo.update(fine.id, { status: "waived", waiveReason: reason });
    await logActivity({
      userId: input.actorId,
      action: "waive_fine",
      entity: "fine",
      entityId: fine.id,
      details: `Waived ${formatINR(fine.amount)}. ${reason}`,
    });
    return updated ?? { ...fine, status: "waived", waiveReason: reason };
  });
}
