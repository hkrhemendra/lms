import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/get-current-user";
import { getLibrarianToday } from "@/lib/services/reports.service";

export const instant = false;

export const metadata = { title: "Librarian dashboard" };

export default async function LibrarianHome() {
  await requireRole(["admin", "librarian"]);
  const today = await getLibrarianToday();
  const cards = [
    ["Issued today", today.issuedToday],
    ["Returned today", today.returnedToday],
    ["Overdue", today.overdue],
    ["Pending reservations", today.pendingReservations],
  ];
  return (
    <>
      <PageHeader title="Circulation desk" description="Today's loans, returns, and queues." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/librarian/circulation/issue" />}>Issue a book</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/librarian/circulation/return" />}>
          Return a book
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/librarian/books/new" />}>
          Add a book
        </Button>
      </div>
    </>
  );
}
