"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateMemberAction } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Member } from "@/types";

export function MemberActions({ member }: { member: Member }) {
  const [validTill, setValidTill] = useState(member.validTill);
  const [pending, setPending] = useState(false);
  const nextStatus = member.status === "active" ? "inactive" : "active";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-col gap-1 text-sm">
        Extend validity
        <Input type="date" value={validTill} onChange={(event) => setValidTill(event.target.value)} />
      </label>
      <Button
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await updateMemberAction(member.id, { validTill });
          setPending(false);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        }}
      >
        Save date
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await updateMemberAction(member.id, { status: nextStatus });
          setPending(false);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        }}
      >
        {nextStatus === "active" ? "Activate" : "Deactivate"}
      </Button>
    </div>
  );
}
