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

export function formatMonthLabel(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  );
}
