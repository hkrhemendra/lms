"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changePasswordAction, updateProfileAction } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function ProfileForm({ phone, address, photoUrl }: { phone: string; address: string; photoUrl: string }) {
  const [pending, setPending] = useState(false);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          const result = await updateProfileAction({
            phone: form.get("phone"),
            address: form.get("address"),
            photoUrl: form.get("photoUrl"),
          });
          setPending(false);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <Input id="phone" name="phone" defaultValue={phone} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Input id="address" name="address" defaultValue={address} />
          </Field>
          <Field>
            <FieldLabel htmlFor="photoUrl">Photo URL</FieldLabel>
            <Input id="photoUrl" name="photoUrl" defaultValue={photoUrl} />
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Save profile
        </Button>
      </form>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          const result = await changePasswordAction({
            currentPassword: form.get("currentPassword"),
            newPassword: form.get("newPassword"),
            confirmPassword: form.get("confirmPassword"),
          });
          setPending(false);
          if (result.success) {
            toast.success(result.message);
            event.currentTarget.reset();
          } else toast.error(result.message);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <Input id="newPassword" name="newPassword" type="password" minLength={6} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <Input id="confirmPassword" name="confirmPassword" type="password" minLength={6} required />
          </Field>
        </FieldGroup>
        <Button type="submit" variant="outline" disabled={pending}>
          Change password
        </Button>
      </form>
    </div>
  );
}
