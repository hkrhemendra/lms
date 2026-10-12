import { Badge } from "@/components/ui/badge";

const variants = {
  available: "available",
  issued: "issued",
  reserved: "reserved",
  overdue: "overdue",
  unpaid: "overdue",
  lost: "lost",
  damaged: "lost",
  paid: "paid",
  waived: "waived",
  waiting: "due",
  ready: "reserved",
  active: "available",
  inactive: "lost",
  blocked: "overdue",
  returned: "paid",
  fulfilled: "paid",
  cancelled: "waived",
  expired: "lost",
  due: "due",
  good: "available",
} as const;

export function StatusBadge({ status }: { status: string }) {
  const variant = variants[status as keyof typeof variants] ?? "outline";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
