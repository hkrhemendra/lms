"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotAction } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <main className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We will pretend to send a reset link. Email is not connected yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const email = new FormData(event.currentTarget).get("email");
              setPending(true);
              const result = await forgotAction({ email });
              setPending(false);
              if (result.success) {
                setSent(true);
                toast.success(result.message);
              } else toast.error(result.message);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={pending}>
              Send reset link
            </Button>
            {sent ? <p className="text-sm">If this email exists, a reset link has been sent.</p> : null}
            <Link href="/login" className="text-sm text-primary underline-offset-4 hover:underline">
              Back to login
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
