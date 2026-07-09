export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameLocalDay(a: string | Date, b: Date): boolean {
  const da = typeof a === 'string' ? new Date(a) : a;
  return (
    da.getFullYear() === b.getFullYear()
    && da.getMonth() === b.getMonth()
    && da.getDate() === b.getDate()
  );
}

export function formatPanelDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(date);
}

export function toLocalDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameLocalDayFromIso(iso: string | null | undefined, day: Date): boolean {
  if (!iso) return false;
  return isSameLocalDay(iso, day);
}

export function formatMonthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  );
}
