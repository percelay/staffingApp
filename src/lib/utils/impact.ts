/**
 * Opportunity Impact Analysis
 *
 * Computes projected utilization and capacity conflicts
 * if tentative assignments from opportunity scenarios were to win.
 * NEVER modifies actual utilization — purely read-only projections.
 */

import { parseISO } from 'date-fns';
import type { Assignment } from '../types/assignment';
import type { Scenario, TentativeAssignment } from '../types/opportunity';
import { getWeeksBetween, normalizeDateInterval } from './date-helpers';

/**
 * Projected utilization = actual allocation + tentative allocation on a given date.
 * Does NOT modify any store — returns a number for display only.
 */
function getProjectedUtilization(
  consultantId: string,
  realAssignments: Assignment[],
  tentativeAssignments: TentativeAssignment[],
  date: Date
): number {
  let total = 0;

  for (const a of realAssignments) {
    if (a.consultant_id !== consultantId) continue;
    const interval = normalizeDateInterval(
      parseISO(a.start_date),
      parseISO(a.end_date)
    );
    if (interval && interval.start <= date && interval.end >= date) {
      total += a.allocation_percentage;
    }
  }

  for (const ta of tentativeAssignments) {
    if (ta.consultant_id !== consultantId) continue;
    const interval = normalizeDateInterval(
      parseISO(ta.start_date),
      parseISO(ta.end_date)
    );
    if (interval && interval.start <= date && interval.end >= date) {
      total += ta.allocation_percentage;
    }
  }

  return total;
}

/**
 * Find weeks where consultants would be overallocated if a scenario were won.
 */
export function getCapacityConflicts(
  scenario: Scenario,
  realAssignments: Assignment[]
): { consultant_id: string; week_start: string; projected: number }[] {
  const conflicts: { consultant_id: string; week_start: string; projected: number }[] = [];
  if (scenario.tentative_assignments.length === 0) return conflicts;

  // Find the date range covered by all tentative assignments
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  for (const ta of scenario.tentative_assignments) {
    const interval = normalizeDateInterval(
      parseISO(ta.start_date),
      parseISO(ta.end_date)
    );
    if (!interval) continue;
    if (!minDate || interval.start < minDate) minDate = interval.start;
    if (!maxDate || interval.end > maxDate) maxDate = interval.end;
  }
  if (!minDate || !maxDate) return conflicts;

  const weeks = getWeeksBetween(minDate, maxDate);
  const consultantIds = new Set(
    scenario.tentative_assignments.map((ta) => ta.consultant_id)
  );

  for (const consultantId of consultantIds) {
    for (const weekStart of weeks) {
      const projected = getProjectedUtilization(
        consultantId,
        realAssignments,
        scenario.tentative_assignments,
        weekStart
      );
      if (projected > 100) {
        conflicts.push({
          consultant_id: consultantId,
          week_start: weekStart.toISOString().split('T')[0],
          projected,
        });
      }
    }
  }

  return conflicts;
}

