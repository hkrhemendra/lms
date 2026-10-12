"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { NavItem } from "@/lib/nav";

export function CommandMenu({
  pages,
  books,
  members,
}: {
  pages: NavItem[];
  books: { id: string; title: string; href: string }[];
  members: { id: string; name: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button variant="outline" className="hidden w-56 justify-start text-muted-foreground md:inline-flex" onClick={() => setOpen(true)}>
        <SearchIcon data-icon="inline-start" />
        Search
        <span className="ml-auto text-xs">⌘K</span>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search" onClick={() => setOpen(true)}>
        <SearchIcon />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a page, book, or member" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem key={page.href} onSelect={() => go(page.href)}>
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Books">
            {books.map((book) => (
              <CommandItem key={book.id} onSelect={() => go(book.href)}>
                {book.title}
              </CommandItem>
            ))}
          </CommandGroup>
          {members.length > 0 ? (
            <CommandGroup heading="Members">
              {members.map((member) => (
                <CommandItem key={member.id} onSelect={() => go(member.href)}>
                  {member.name}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
