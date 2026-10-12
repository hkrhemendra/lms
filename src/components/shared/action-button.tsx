"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResult } from "@/types";

export function ActionButton({
  label,
  action,
  variant = "outline",
  disabled,
}: {
  label: string;
  action: () => Promise<ActionResult>;
  variant?: "outline" | "default" | "secondary" | "destructive";
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant={variant}
      disabled={disabled || pending}
      onClick={async () => {
        setPending(true);
        const result = await action();
        setPending(false);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
      }}
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {label}
    </Button>
  );
}
