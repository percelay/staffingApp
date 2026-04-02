import { parseISO } from 'date-fns';
import type { Assignment } from '../types';
import {
  getWeeksBetween,
  isWithinRange,
  normalizeDateInterval,
} from './date-helpers';

export interface AvailabilityGap {
  weekStart: Date;
  allocation: number; // total allocation for that week (0-100+)
}

export function getWeeklyAllocations(
  consultantId: string,
  assignments: Assignment[],
  start: Date,
  end: Date
): AvailabilityGap[] {
  const normalizedWindow = normalizeDateInterval(start, end);
  if (!normalizedWindow) {
    return [];
  }

  const weeks = getWeeksBetween(normalizedWindow.start, normalizedWindow.end);
  const consultantAssignments = assignments.filter(
    (a) => a.consultant_id === consultantId
  );

  return weeks.map((weekStart) => {
    const allocation = consultantAssignments.reduce((total, assignment) => {
      const aStart = parseISO(assignment.start_date);
      const aEnd = parseISO(assignment.end_date);
      if (isWithinRange(weekStart, aStart, aEnd)) {
        return total + assignment.allocation_percentage;
      }
      return total;
    }, 0);

    return { weekStart, allocation };
  });
}

export function getAvailabilityGaps(
  consultantId: string,
  assignments: Assignment[],
  start: Date,
  end: Date
): AvailabilityGap[] {
  return getWeeklyAllocations(consultantId, assignments, start, end).filter(
    (w) => w.allocation < 80
  );
}

export function getAverageAvailability(
  consultantId: string,
  assignments: Assignment[],
  start: Date,
  end: Date
): number {
  const weeks = getWeeklyAllocations(consultantId, assignments, start, end);
  if (weeks.length === 0) return 100;
  const avgAllocation =
    weeks.reduce((sum, w) => sum + w.allocation, 0) / weeks.length;
  return Math.max(0, 100 - avgAllocation);
}

export function isAvailable(
  consultantId: string,
  startDate: string,
  endDate: string,
  assignments: Assignment[]
): boolean {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const gaps = getAvailabilityGaps(consultantId, assignments, start, end);
  return gaps.length > 0;
}
