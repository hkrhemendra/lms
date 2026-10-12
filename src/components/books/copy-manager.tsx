"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addCopyAction, deleteBookAction, updateCopyAction } from "@/lib/actions/library";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookCopy } from "@/types";

export function CopyManager({ bookId, copies }: { bookId: string; copies: BookCopy[] }) {
  const [rack, setRack] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          const result = await addCopyAction(bookId, { rackNo: rack });
          setPending(false);
          if (result.success) {
            toast.success(result.message);
            setRack("");
          } else toast.error(result.message);
        }}
      >
        <Input value={rack} onChange={(event) => setRack(event.target.value)} placeholder="Rack, e.g. R2-S1" aria-label="Rack number" required />
        <Button type="submit" disabled={pending}>
          Add copy
        </Button>
      </form>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Accession</th>
              <th className="p-3 font-medium">Rack</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Condition</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((copy) => (
              <tr key={copy.id} className="border-t">
                <td className="p-3">{copy.accessionNo}</td>
                <td className="p-3">
                  <form
                    className="flex gap-2"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const rackNo = new FormData(event.currentTarget).get("rackNo");
                      const result = await updateCopyAction(copy.id, bookId, { rackNo });
                      if (result.success) toast.success(result.message);
                      else toast.error(result.message);
                    }}
                  >
                    <Input name="rackNo" defaultValue={copy.rackNo} aria-label={`Rack for ${copy.accessionNo}`} className="w-28" />
                    <Button type="submit" variant="outline" size="sm">
                      Save
                    </Button>
                  </form>
                </td>
                <td className="p-3">
                  <StatusBadge status={copy.status} />
                </td>
                <td className="p-3">
                  <Select
                    defaultValue={copy.status === "lost" || copy.status === "damaged" || copy.status === "available" ? copy.status : undefined}
                    onValueChange={(value) => {
                      if (value !== "available" && value !== "lost" && value !== "damaged") return;
                      void updateCopyAction(copy.id, bookId, { status: value }).then((result) => {
                        if (result.success) toast.success(result.message);
                        else toast.error(result.message);
                      });
                    }}
                  >
                    <SelectTrigger aria-label={`Condition for ${copy.accessionNo}`}>
                      <SelectValue placeholder="Set condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmButton
        title="Delete this book?"
        description="Copies that are not issued or reserved will be removed with the title."
        label="Delete book"
        confirmLabel="Delete"
        variant="destructive"
        action={() => deleteBookAction(bookId)}
      />
    </div>
  );
}
