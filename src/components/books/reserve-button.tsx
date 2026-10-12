"use client";

import { ActionButton } from "@/components/shared/action-button";
import { reserveBookAction } from "@/lib/actions/library";

export function ReserveButton({ bookId, disabled, reason }: { bookId: string; disabled?: boolean; reason: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <ActionButton label="Reserve" disabled={disabled} action={() => reserveBookAction(bookId)} />
      <p className="text-sm text-muted-foreground">{reason}</p>
    </div>
  );
}
