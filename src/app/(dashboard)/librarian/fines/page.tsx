import { PageHeader } from "@/components/layout/page-header";
import { FineBoard } from "@/components/fines/fine-board";
import { requireRole } from "@/lib/auth/get-current-user";
import { finesRepo } from "@/lib/data/repositories/fines.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";

export const instant = false;

export const metadata = { title: "Fines" };

export default async function FinesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole(["admin", "librarian"]);
  const params = await searchParams;
  const status = params.status === "paid" || params.status === "waived" ? params.status : "unpaid";
  const [fines, members, users, settings] = await Promise.all([
    finesRepo.getAll(),
    membersRepo.getAll(),
    usersRepo.getAll(),
    settingsRepo.get(),
  ]);
  const rows = fines
    .filter((fine) => fine.status === status)
    .map((fine) => {
      const member = members.find((row) => row.id === fine.memberId);
      const account = users.find((row) => row.id === member?.userId);
      return {
        id: fine.id,
        member: account?.name ?? member?.memberCode ?? "Member",
        amount: fine.amount,
        reason: fine.reason,
        status: fine.status,
        receiptNo: fine.receiptNo,
        paidDate: fine.paidDate,
        waiveReason: fine.waiveReason,
      };
    });
  return (
    <>
      <PageHeader title="Fines" description="Record a payment or, if you are an admin, waive a fine with a reason." />
      <FineBoard rows={rows} status={status} canWaive={user.role === "admin"} libraryName={settings.libraryName} />
    </>
  );
}
