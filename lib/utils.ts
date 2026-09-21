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

/**
 * Progressive module unlocking: a module is available when it is the first
 * published module or when the module that precedes it (by week) is done.
 * Mentees must complete each module before the next one opens.
 */
export function unlockedModuleIds(
  modules: { id: string; week_no: number }[],
  done: Set<string>
): Set<string> {
  const ids = new Set<string>();
  const sorted = [...modules].sort((a, b) => a.week_no - b.week_no);
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || done.has(sorted[i - 1].id)) ids.add(sorted[i].id);
  }
  return ids;
}