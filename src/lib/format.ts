import { format, parseISO } from "date-fns";
import { diffDays, todayDate } from "@/lib/dates";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const iso = value.length === 10 ? `${value}T00:00:00` : value;
  return format(parseISO(iso), "dd MMM yyyy");
}

export function dueLabel(dueDate: string, today = todayDate()): string {
  const days = diffDays(dueDate, today);
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  const late = Math.abs(days);
  return late === 1 ? "1 day overdue" : `${late} days overdue`;
}

export function dueTone(dueDate: string, today = todayDate()): "ok" | "soon" | "overdue" {
  const days = diffDays(dueDate, today);
  if (days < 0) return "overdue";
  if (days <= 2) return "soon";
  return "ok";
}
