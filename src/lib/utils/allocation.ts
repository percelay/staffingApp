import { parseISO } from 'date-fns';
import type { Assignment } from '@/lib/types/assignment';

const ALLOCATION_PERCENT_PER_DAY = 20;

export function allocationPercentageToManDays(allocationPercentage: number) {
  return allocationPercentage / ALLOCATION_PERCENT_PER_DAY;
}

export function formatManDaysPerWeek(
  manDays: number,
  format: 'compact' | 'full' = 'full'
) {
  const rounded = Number.isInteger(manDays)
    ? manDays.toFixed(0)
    : manDays.toFixed(1);

  if (format === 'compact') {
    return `${rounded} d/wk`;
  }

  const suffix = Math.abs(manDays - 1) < 0.001 ? 'man-day/week' : 'man-days/week';
  return `${rounded} ${suffix}`;
}

export function formatAllocationAsManDays(
  allocationPercentage: number,
  format: 'compact' | 'full' = 'full'
) {
  return formatManDaysPerWeek(
    allocationPercentageToManDays(allocationPercentage),
    format
  );
}

export function isAssignmentActiveOnDate(
  assignment: Assignment,
  date: Date = new Date()
) {
  const start = parseISO(assignment.start_date);
  const end = parseISO(assignment.end_date);

  return start <= date && end >= date;
}

export function getCurrentConsultantUtilization(
  consultantId: string,
  assignments: Assignment[],
  date: Date = new Date()
) {
  return assignments.reduce((total, assignment) => {
    if (
      assignment.consultant_id !== consultantId ||
      !isAssignmentActiveOnDate(assignment, date)
    ) {
      return total;
    }

    return total + assignment.allocation_percentage;
  }, 0);
}

function getEngagementAllocationPercentage(
  engagementId: string,
  assignments: Assignment[]
) {
  return assignments.reduce((total, assignment) => {
    if (assignment.engagement_id !== engagementId) {
      return total;
    }

    return total + assignment.allocation_percentage;
  }, 0);
}

export function getEngagementManDaysPerWeek(
  engagementId: string,
  assignments: Assignment[]
) {
  return allocationPercentageToManDays(
    getEngagementAllocationPercentage(engagementId, assignments)
  );
}
