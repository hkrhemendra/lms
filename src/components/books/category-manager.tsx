"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/actions/library";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Category } from "@/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <>
      <PageHeader title="Categories" description="Group the catalogue so members can filter it." />
      <form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          const result = await saveCategoryAction({ name, description });
          setPending(false);
          if (result.success) {
            toast.success(result.message);
            setName("");
            setDescription("");
          } else toast.error(result.message);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Input id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={pending}>
          Add category
        </Button>
      </form>
      <ul className="flex flex-col gap-3">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            <ConfirmButton
              title={`Delete ${category.name}?`}
              description="This fails if any book still uses the category."
              label="Delete"
              confirmLabel="Delete"
              variant="destructive"
              action={() => deleteCategoryAction(category.id)}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
