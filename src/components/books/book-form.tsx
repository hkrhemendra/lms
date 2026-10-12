"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveBookAction } from "@/lib/actions/library";
import { bookSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { z } from "zod";

type Values = z.infer<typeof bookSchema>;

export function BookForm({
  categories,
  book,
}: {
  categories: { id: string; name: string }[];
  book?: Values & { id: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const form = useForm<Values>({
    defaultValues: book ?? {
      title: "",
      author: "",
      isbn: "",
      publisher: "",
      edition: "",
      year: new Date().getFullYear(),
      categoryId: categories[0]?.id ?? "",
      language: "English",
      pages: "",
      description: "",
      coverImage: "",
    },
  });

  return (
    <form
      className="flex max-w-2xl flex-col gap-4"
      onSubmit={form.handleSubmit(async (values) => {
        setPending(true);
        const result = await saveBookAction(values, book?.id);
        setPending(false);
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        router.push(`/librarian/books/${result.data?.id ?? book?.id}`);
      })}
    >
      <FieldGroup>
        {(
          [
            ["title", "Title"],
            ["author", "Author"],
            ["isbn", "ISBN"],
            ["publisher", "Publisher"],
            ["edition", "Edition"],
            ["language", "Language"],
          ] as const
        ).map(([name, label]) => (
          <Field key={name} data-invalid={Boolean(form.formState.errors[name]) || undefined}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <Input id={name} aria-invalid={Boolean(form.formState.errors[name])} {...form.register(name)} />
            <FieldError errors={[form.formState.errors[name]]} />
          </Field>
        ))}
        <Field>
          <FieldLabel htmlFor="year">Year</FieldLabel>
          <Input id="year" type="number" {...form.register("year")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="pages">Pages</FieldLabel>
          <Input id="pages" type="number" {...form.register("pages")} />
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select value={form.watch("categoryId")} onValueChange={(value) => form.setValue("categoryId", value ?? "")}>
            <SelectTrigger className="w-full" aria-label="Category">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" {...form.register("description")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="coverImage">Cover image URL</FieldLabel>
          <Input id="coverImage" {...form.register("coverImage")} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save book
      </Button>
    </form>
  );
}
