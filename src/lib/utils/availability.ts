import { parseISO } from 'date-fns';
import type { Assignment } from '../types';
import {
  getWeeksBetween,
  isWithinRange,
  normalizeDateInterval,
} from './date-helpers';

interface AvailabilityGap {
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

