"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { payFineAction, waiveFineAction } from "@/lib/actions/library";
import { formatDate, formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Row = {
  id: string;
  member: string;
  amount: number;
  reason: string;
  status: string;
  receiptNo?: string;
  paidDate?: string;
  waiveReason?: string;
};

export function FineBoard({
  rows,
  status,
  canWaive,
  libraryName,
}: {
  rows: Row[];
  status: string;
  canWaive: boolean;
  libraryName: string;
}) {
  const [receipt, setReceipt] = useState<Row | null>(null);
  const [reason, setReason] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {["unpaid", "paid", "waived"].map((item) => (
          <Button key={item} size="sm" variant={item === status ? "default" : "outline"} nativeButton={false} render={<Link href={`/librarian/fines?status=${item}`} />}>
            {item}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Member</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Reason</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-3">{row.member}</td>
                <td className="p-3">{formatINR(row.amount)}</td>
                <td className="p-3">{row.reason}</td>
                <td className="p-3">
                  {row.status === "unpaid" ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        onClick={async () => {
                          const result = await payFineAction(row.id);
                          if (!result.success) {
                            toast.error(result.message);
                            return;
                          }
                          toast.success(result.message);
                          setReceipt({ ...row, status: "paid", receiptNo: result.data?.receiptNo, paidDate: new Date().toISOString().slice(0, 10) });
                        }}
                      >
                        Mark paid
                      </Button>
                      {canWaive ? (
                        <form
                          className="flex gap-2"
                          onSubmit={async (event) => {
                            event.preventDefault();
                            const result = await waiveFineAction({ fineId: row.id, reason });
                            if (result.success) toast.success(result.message);
                            else toast.error(result.message);
                          }}
                        >
                          <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Waive reason" aria-label="Waive reason" />
                          <Button type="submit" size="sm" variant="outline">
                            Waive
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <span>{row.receiptNo || row.waiveReason || row.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={Boolean(receipt)} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="print:shadow-none">
          <DialogHeader>
            <DialogTitle>Receipt {receipt?.receiptNo}</DialogTitle>
            <DialogDescription>{libraryName}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm">
            <p>{receipt?.member}</p>
            <p>{formatINR(receipt?.amount ?? 0)} · {receipt?.reason}</p>
            <p>Paid {formatDate(receipt?.paidDate)}</p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => window.print()}>
            Print
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
