/**
 * Opportunity Impact Analysis
 *
 * Computes projected utilization and capacity conflicts
 * if tentative assignments from opportunity scenarios were to win.
 * NEVER modifies actual utilization — purely read-only projections.
 */

import { parseISO } from 'date-fns';
import type { Assignment } from '../types/assignment';
import type { Opportunity, Scenario, TentativeAssignment } from '../types/opportunity';
import {
  getWeeksBetween,
  isWithinRange,
  normalizeDateInterval,
} from './date-helpers';

/**
 * Projected utilization = actual allocation + tentative allocation on a given date.
 * Does NOT modify any store — returns a number for display only.
 */
export function getProjectedUtilization(
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

/**
 * Probability-weighted utilization for a consultant across all active opportunities.
 * allocation * (probability / 100) — so a 50% probable opp with 100% alloc = 50% weighted.
 */
export function getWeightedPipelineUtilization(
  consultantId: string,
  opportunities: Opportunity[],
  scenarios: Scenario[],
  date: Date
): number {
  let weighted = 0;

  for (const opp of opportunities) {
    // Only count active pipeline opportunities
    if (opp.stage === 'won' || opp.stage === 'lost') continue;

    // Find the default scenario for this opportunity
    const defaultScenario = scenarios.find(
      (s) => s.opportunity_id === opp.id && s.is_default
    ) || scenarios.find((s) => s.opportunity_id === opp.id);

    if (!defaultScenario) continue;

    for (const ta of defaultScenario.tentative_assignments) {
      if (ta.consultant_id !== consultantId) continue;
      const interval = normalizeDateInterval(
        parseISO(ta.start_date),
        parseISO(ta.end_date)
      );
      if (interval && interval.start <= date && interval.end >= date) {
        weighted += ta.allocation_percentage * (opp.probability / 100);
      }
    }
  }

  return Math.round(weighted);
}

/**
 * Weekly projected allocations for timeline overlay.
 * Returns allocation per week combining real + weighted tentative.
 */
export function getWeeklyProjectedAllocations(
  consultantId: string,
  realAssignments: Assignment[],
  opportunities: Opportunity[],
  scenarios: Scenario[],
  start: Date,
  end: Date
): { weekStart: Date; actual: number; tentative: number; total: number }[] {
  const weeks = getWeeksBetween(start, end);
  const consultantAssignments = realAssignments.filter(
    (a) => a.consultant_id === consultantId
  );

  return weeks.map((weekStart) => {
    const actual = consultantAssignments.reduce((total, a) => {
      if (isWithinRange(weekStart, parseISO(a.start_date), parseISO(a.end_date))) {
        return total + a.allocation_percentage;
      }
      return total;
    }, 0);

    const tentative = getWeightedPipelineUtilization(
      consultantId,
      opportunities,
      scenarios,
      weekStart
    );

    return { weekStart, actual, tentative, total: actual + tentative };
  });
}
