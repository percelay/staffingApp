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
} from 'date-fns';

export function getWeeksBetween(start: Date, end: Date): Date[] {
  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
}

export function getWeekLabel(date: Date): string {
  return format(date, 'MMM d');
}

export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end });
}

export function get12WeekWindow(offset: number = 0): { start: Date; end: Date } {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const start = addWeeks(now, offset);
  const end = addWeeks(start, 12);
  return { start, end };
}

export function getWeekCount(startDate: string, endDate: string): number {
  return differenceInWeeks(parseISO(endDate), parseISO(startDate));
}

export function dateToISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const a1 = parseISO(aStart);
  const a2 = parseISO(aEnd);
  const b1 = parseISO(bStart);
  const b2 = parseISO(bEnd);
  return isBefore(a1, b2) && isAfter(a2, b1);
}
