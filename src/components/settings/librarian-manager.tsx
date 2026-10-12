"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createLibrarianAction, setUserStatusAction } from "@/lib/actions/library";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/types";

export function LibrarianManager({ users }: { users: User[] }) {
  const [pending, setPending] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setPending(true);
          const result = await createLibrarianAction({
            name: form.get("name"),
            email: form.get("email"),
            password: form.get("password"),
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
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" name="password" type="password" minLength={6} required />
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Add librarian
        </Button>
      </form>
      <ul className="flex flex-col gap-3">
        {users.map((user) => (
          <li key={user.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={user.status} />
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await setUserStatusAction(user.id, user.status === "active" ? "blocked" : "active");
                  if (result.success) toast.success(result.message);
                  else toast.error(result.message);
                }}
              >
                {user.status === "active" ? "Block" : "Unblock"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
