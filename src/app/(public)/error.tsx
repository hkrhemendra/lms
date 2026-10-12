"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 p-6">
      <h1 className="text-2xl font-semibold">The catalogue could not be loaded</h1>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
