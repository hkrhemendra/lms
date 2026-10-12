export const LIBRARY_TIMEZONE = "Asia/Kolkata";

export function todayDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LIBRARY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function diffDays(later: string, earlier: string): number {
  const a = Date.parse(`${later}T00:00:00Z`);
  const b = Date.parse(`${earlier}T00:00:00Z`);
  return Math.round((a - b) / 86_400_000);
}

export function stampCompact(isoDate = todayDate()): string {
  return isoDate.replaceAll("-", "");
}
