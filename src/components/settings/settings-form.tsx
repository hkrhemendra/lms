"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Rule, Settings } from "@/types";

function RuleFields({ prefix, title, rule }: { prefix: "student" | "faculty"; title: string; rule: Rule }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border p-4">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      {(
        [
          ["issueLimit", "Issue limit", rule.issueLimit],
          ["loanDays", "Loan days", rule.loanDays],
          ["finePerDay", "Fine per day (₹)", rule.finePerDay],
          ["maxRenewals", "Max renewals", rule.maxRenewals],
        ] as const
      ).map(([name, label, value]) => (
        <Field key={name}>
          <FieldLabel htmlFor={`${prefix}-${name}`}>{label}</FieldLabel>
          <Input id={`${prefix}-${name}`} name={`${prefix}.${name}`} type="number" defaultValue={value} required />
        </Field>
      ))}
    </fieldset>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [pending, setPending] = useState(false);
  return (
    <form
      className="flex max-w-3xl flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const num = (key: string) => Number(form.get(key));
        setPending(true);
        const result = await saveSettingsAction({
          libraryName: form.get("libraryName"),
          libraryEmail: form.get("libraryEmail"),
          finePerDayLost: num("finePerDayLost"),
          reservationHoldDays: num("reservationHoldDays"),
          maxUnpaidFineToIssue: num("maxUnpaidFineToIssue"),
          student: {
            issueLimit: num("student.issueLimit"),
            loanDays: num("student.loanDays"),
            finePerDay: num("student.finePerDay"),
            maxRenewals: num("student.maxRenewals"),
          },
          faculty: {
            issueLimit: num("faculty.issueLimit"),
            loanDays: num("faculty.loanDays"),
            finePerDay: num("faculty.finePerDay"),
            maxRenewals: num("faculty.maxRenewals"),
          },
        });
        setPending(false);
        if (result.success) toast.success(result.message);
        else toast.error(result.message);
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="libraryName">Library name</FieldLabel>
          <Input id="libraryName" name="libraryName" defaultValue={settings.libraryName} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="libraryEmail">Library email</FieldLabel>
          <Input id="libraryEmail" name="libraryEmail" type="email" defaultValue={settings.libraryEmail} required />
        </Field>
      </FieldGroup>
      <div className="grid gap-4 md:grid-cols-2">
        <RuleFields prefix="student" title="Students" rule={settings.student} />
        <RuleFields prefix="faculty" title="Faculty" rule={settings.faculty} />
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="finePerDayLost">Lost book fine (₹)</FieldLabel>
          <Input id="finePerDayLost" name="finePerDayLost" type="number" defaultValue={settings.finePerDayLost} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="reservationHoldDays">Reservation hold (days)</FieldLabel>
          <Input
            id="reservationHoldDays"
            name="reservationHoldDays"
            type="number"
            defaultValue={settings.reservationHoldDays}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="maxUnpaidFineToIssue">Block issues above unpaid fines (₹)</FieldLabel>
          <Input
            id="maxUnpaidFineToIssue"
            name="maxUnpaidFineToIssue"
            type="number"
            defaultValue={settings.maxUnpaidFineToIssue}
            required
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save rules
      </Button>
    </form>
  );
}
