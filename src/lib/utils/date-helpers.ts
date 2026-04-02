import {
  eachWeekOfInterval,
  format,
  isWithinInterval,
  addWeeks,
  startOfWeek,
  differenceInWeeks,
  parseISO,
  isBefore,
  isAfter,
  isValid,
} from 'date-fns';

export function normalizeDateInterval(
  start: Date,
  end: Date
): { start: Date; end: Date } | null {
  if (!isValid(start) || !isValid(end)) {
    return null;
  }

  return start <= end ? { start, end } : { start: end, end: start };
}

export function normalizeIsoDateRange(
  startDate: string,
  endDate: string
): { startDate: string; endDate: string } | null {
  const normalized = normalizeDateInterval(
    parseISO(startDate),
    parseISO(endDate)
  );

  if (!normalized) {
    return null;
  }

  return {
    startDate: format(normalized.start, 'yyyy-MM-dd'),
    endDate: format(normalized.end, 'yyyy-MM-dd'),
  };
}

export function getWeeksBetween(start: Date, end: Date): Date[] {
  const normalized = normalizeDateInterval(start, end);
  if (!normalized) {
    return [];
  }

  return eachWeekOfInterval(normalized, { weekStartsOn: 1 });
}

export function getWeekLabel(date: Date): string {
  return format(date, 'MMM d');
}

export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const normalized = normalizeDateInterval(start, end);
  if (!normalized || !isValid(date)) {
    return false;
  }

  return isWithinInterval(date, normalized);
}

export function get12WeekWindow(offset: number = 0): { start: Date; end: Date } {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const start = addWeeks(now, offset);
  const end = addWeeks(start, 12);
  return { start, end };
}

export function getWeekCount(startDate: string, endDate: string): number {
  const normalized = normalizeDateInterval(
    parseISO(startDate),
    parseISO(endDate)
  );
  if (!normalized) {
    return 0;
  }

  return differenceInWeeks(normalized.end, normalized.start);
}

export function dateToISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatIsoDate(
  value: string,
  pattern: string = 'MMM d, yyyy',
  fallback: string = '--'
): string {
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return fallback;
  }

  return format(parsed, pattern);
}

export function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const left = normalizeDateInterval(parseISO(aStart), parseISO(aEnd));
  const right = normalizeDateInterval(parseISO(bStart), parseISO(bEnd));

  if (!left || !right) {
    return false;
  }

  return isBefore(left.start, right.end) && isAfter(left.end, right.start);
}
