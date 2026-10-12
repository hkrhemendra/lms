"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createMemberAction } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { addDays, todayDate } from "@/lib/dates";

export function MemberForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [memberType, setMemberType] = useState<"student" | "faculty">("student");

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        const result = await createMemberAction({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          memberType,
          enrolmentNo: form.get("enrolmentNo"),
          course: form.get("course") || undefined,
          department: form.get("department") || undefined,
          phone: form.get("phone"),
          address: form.get("address") || undefined,
          validTill: form.get("validTill"),
        });
        setPending(false);
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        router.push(`/librarian/members/${result.data?.id}`);
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Temporary password</FieldLabel>
          <Input id="password" name="password" type="password" minLength={6} required />
        </Field>
        <Field>
          <FieldLabel>Type</FieldLabel>
          <Select value={memberType} onValueChange={(value) => setMemberType(value === "faculty" ? "faculty" : "student")}>
            <SelectTrigger className="w-full" aria-label="Member type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="enrolmentNo">Enrolment number</FieldLabel>
          <Input id="enrolmentNo" name="enrolmentNo" required />
        </Field>
        {memberType === "student" ? (
          <Field>
            <FieldLabel htmlFor="course">Course</FieldLabel>
            <Input id="course" name="course" placeholder="MCA, BCA, or MBA" required />
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="department">Department</FieldLabel>
            <Input id="department" name="department" required />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input id="phone" name="phone" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input id="address" name="address" />
        </Field>
        <Field>
          <FieldLabel htmlFor="validTill">Valid till</FieldLabel>
          <Input id="validTill" name="validTill" type="date" defaultValue={addDays(todayDate(), memberType === "faculty" ? 1800 : 700)} required />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Register member
      </Button>
    </form>
  );
}
