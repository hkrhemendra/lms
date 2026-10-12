"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { issueBookAction } from "@/lib/actions/library";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type RuleCheck = { label: string; ok: boolean; detail: string };

export function IssueDesk({
  members,
  copies,
  memberId,
  copyId,
  checks,
}: {
  members: { id: string; name: string; code: string; type: string; active: number; limit: number; unpaid: number }[];
  copies: { id: string; label: string; status: string }[];
  memberId?: string;
  copyId?: string;
  checks: { checks: RuleCheck[]; canIssue: boolean } | null;
}) {
  const router = useRouter();
  const [memberQuery, setMemberQuery] = useState("");
  const [copyQuery, setCopyQuery] = useState("");
  const [pending, setPending] = useState(false);
  const member = members.find((row) => row.id === memberId);
  const filteredMembers = useMemo(
    () => members.filter((row) => `${row.name} ${row.code}`.toLowerCase().includes(memberQuery.toLowerCase())).slice(0, 8),
    [members, memberQuery],
  );
  const filteredCopies = useMemo(
    () => copies.filter((row) => row.label.toLowerCase().includes(copyQuery.toLowerCase())).slice(0, 8),
    [copies, copyQuery],
  );

  function choose(nextMember = memberId, nextCopy = copyId) {
    const params = new URLSearchParams();
    if (nextMember) params.set("member", nextMember);
    if (nextCopy) params.set("copy", nextCopy);
    router.push(`/librarian/circulation/issue?${params.toString()}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Member</h2>
        <Input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} placeholder="Name or member code" aria-label="Search members" />
        <ul className="flex flex-col gap-2">
          {filteredMembers.map((row) => (
            <li key={row.id}>
              <button type="button" className="w-full rounded-xl border p-3 text-left hover:bg-muted" onClick={() => choose(row.id, copyId)}>
                <span className="font-medium">{row.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {row.code} · {row.active} of {row.limit} loans · {formatINR(row.unpaid)} unpaid
                </span>
              </button>
            </li>
          ))}
        </ul>
        {member ? (
          <p className="text-sm">
            Selected: {member.name}. {member.active} of {member.limit} active loans. Unpaid fines {formatINR(member.unpaid)}.
          </p>
        ) : null}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Copy</h2>
        <Input value={copyQuery} onChange={(event) => setCopyQuery(event.target.value)} placeholder="Title, ISBN, or accession number" aria-label="Search copies" />
        <ul className="flex flex-col gap-2">
          {filteredCopies.map((row) => (
            <li key={row.id}>
              <button type="button" className="w-full rounded-xl border p-3 text-left hover:bg-muted" onClick={() => choose(memberId, row.id)}>
                {row.label}
                <span className="block text-sm text-muted-foreground">{row.status}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {checks ? (
        <section className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-lg font-medium">Rule check</h2>
          <ul className="flex flex-col gap-2">
            {checks.checks.map((check) => (
              <li key={check.label} className="rounded-xl border p-3 text-sm">
                <span className="font-medium">{check.ok ? "Pass" : "Blocked"} · {check.label}</span>
                <span className="block text-muted-foreground">{check.detail}</span>
              </li>
            ))}
          </ul>
          <Button
            disabled={!checks.canIssue || !memberId || !copyId || pending}
            onClick={async () => {
              setPending(true);
              const result = await issueBookAction({ memberId, copyId });
              setPending(false);
              if (result.success) toast.success(result.message);
              else toast.error(result.message);
            }}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Confirm issue
          </Button>
        </section>
      ) : null}
    </div>
  );
}
