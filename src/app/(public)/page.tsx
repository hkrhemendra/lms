import Link from "next/link";
import { BookOpenIcon, SearchIcon, Undo2Icon } from "lucide-react";
import { BookCover } from "@/components/shared/book-cover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoriesRepo } from "@/lib/data/repositories/categories.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { listBookSummaries } from "@/lib/services/catalogue.service";

export const instant = false;

export default async function HomePage() {
  const [settings, books, members, categories] = await Promise.all([
    settingsRepo.get(),
    listBookSummaries(),
    membersRepo.getAll(),
    categoriesRepo.getAll(),
  ]);
  const arrivals = [...books].sort((a, b) => b.year - a.year).slice(0, 8);
  const copies = books.reduce((sum, book) => sum + book.totalCopies, 0);

  return (
    <main>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 md:py-24">
        <div className="max-w-2xl flex flex-col gap-4">
          <p className="text-sm font-medium text-primary">{settings.libraryName}</p>
          <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
            A quiet place for every book on campus.
          </h1>
          <p className="text-base text-muted-foreground">
            Search the catalogue, see what is on the shelf, and manage loans, fines, and reservations in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/catalogue" />}>Search catalogue</Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Login
            </Button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Titles", books.length],
            ["Copies", copies],
            ["Members", members.length],
            ["Categories", categories.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border bg-card p-6 shadow-sm">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16">
        <h2 className="text-lg font-medium">New arrivals</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {arrivals.map((book) => (
            <Link key={book.id} href={`/catalogue/${book.id}`} className="flex flex-col gap-3 rounded-xl focus-visible:ring-3 focus-visible:ring-ring">
              <BookCover title={book.title} category={book.categoryName} coverImage={book.coverImage} />
              <div>
                <p className="truncate text-sm font-medium">{book.title}</p>
                <p className="truncate text-xs text-muted-foreground">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 md:grid-cols-3">
        {[
          { icon: SearchIcon, title: "Search", text: "Find a title by name, author, or ISBN." },
          { icon: BookOpenIcon, title: "Borrow", text: "Collect it at the desk within your loan limit." },
          { icon: Undo2Icon, title: "Return", text: "Bring it back on time, or reserve the next copy." },
        ].map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <step.icon className="size-4 text-primary" />
              <CardTitle>{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{step.text}</CardContent>
          </Card>
        ))}
      </section>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>{settings.libraryName}</p>
          <a href={`mailto:${settings.libraryEmail}`}>{settings.libraryEmail}</a>
        </div>
      </footer>
    </main>
  );
}
