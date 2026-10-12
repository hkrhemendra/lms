import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-6">
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
