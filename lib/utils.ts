export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function currentWeekNo(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.min(52, Math.ceil((days + start.getDay() + 1) / 7));
}

export function weekLabel(week: number): string {
  return `WEEK ${String(week).padStart(2, "0")}`;
}