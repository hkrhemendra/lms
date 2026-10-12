"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CatalogueFilters({
  basePath,
  q,
  category,
  categories,
}: {
  basePath: string;
  q: string;
  category: string;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  function update(next: { q?: string; category?: string }) {
    const params = new URLSearchParams();
    const query = next.q ?? q;
    const cat = next.category ?? category;
    if (query) params.set("q", query);
    if (cat && cat !== "all") params.set("category", cat);
    const suffix = params.toString();
    router.push(suffix ? `${basePath}?${suffix}` : basePath);
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        defaultValue={q}
        placeholder="Title, author, or ISBN"
        aria-label="Search catalogue"
        onChange={(event) => update({ q: event.target.value })}
      />
      <Select value={category || "all"} onValueChange={(value) => update({ category: value ?? "all" })}>
        <SelectTrigger className="sm:w-56" aria-label="Category">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
