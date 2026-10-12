"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { returnBookAction } from "@/lib/actions/library";
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
import { Spinner } from "@/components/ui/spinner";
import type { ReturnCondition } from "@/types";

export function ReturnDesk({
  q,
  loans,
  issueId,
  condition,
  damage,
  message,
}: {
  q: string;
  loans: { id: string; label: string }[];
  issueId?: string;
  condition: ReturnCondition;
  damage: string;
  message: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(q);
  const [pending, setPending] = useState(false);

  function go(next: { issue?: string; condition?: string; damage?: string; q?: string }) {
    const params = new URLSearchParams();
    const queryValue = next.q ?? query;
    const issue = next.issue ?? issueId;
    const cond = next.condition ?? condition;
    const amount = next.damage ?? damage;
    if (queryValue) params.set("q", queryValue);
    if (issue) params.set("issue", issue);
    if (cond) params.set("condition", cond);
    if (amount) params.set("damage", amount);
    router.push(`/librarian/circulation/return?${params.toString()}`);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          go({ q: query });
        }}
      >
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Accession number or member" aria-label="Find a loan" />
        <Button type="submit" variant="outline">
          Find
        </Button>
      </form>
      <ul className="flex flex-col gap-2">
        {loans.map((loan) => (
          <li key={loan.id}>
            <button type="button" className="w-full rounded-xl border p-3 text-left text-sm hover:bg-muted" onClick={() => go({ issue: loan.id })}>
              {loan.label}
            </button>
          </li>
        ))}
      </ul>
      {issueId ? (
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <Select value={condition} onValueChange={(value) => go({ condition: value ?? "good" })}>
            <SelectTrigger aria-label="Condition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {condition === "damaged" ? (
            <Input
              type="number"
              min={1}
              value={damage}
              aria-label="Damage fine"
              placeholder="Damage amount"
              onChange={(event) => go({ damage: event.target.value })}
            />
          ) : null}
          {message ? <p className="text-sm">{message}</p> : null}
          <Button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const result = await returnBookAction({
                issueId,
                condition,
                damageAmount: damage ? Number(damage) : undefined,
              });
              setPending(false);
              if (result.success) toast.success(result.message);
              else toast.error(result.message);
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Confirm return
          </Button>
        </div>
      ) : null}
    </div>
  );
}
