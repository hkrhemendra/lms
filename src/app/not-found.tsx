import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">This page is not on the shelves</h1>
      <Button nativeButton={false} render={<Link href="/" />}>Back to the library</Button>
    </main>
  );
}
