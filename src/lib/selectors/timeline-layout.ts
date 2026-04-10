import { parseISO } from 'date-fns';
import type { Assignment } from '@/lib/types/assignment';
import {
  PRACTICE_AREA_LABELS,
  SENIORITY_ORDER,
  type Consultant,
} from '@/lib/types/consultant';

export const TIMELINE_BASE_LANE_HEIGHT = 64;
export const TIMELINE_BLOCK_PADDING = 6;

const BASE_BLOCK_HEIGHT =
  TIMELINE_BASE_LANE_HEIGHT - TIMELINE_BLOCK_PADDING * 2;

interface ConsultantTimelineGroup {
  practiceArea: string;
  label: string;
  consultants: Consultant[];
}

export interface TimelineAssignmentLayout {
  clippedStart: Date;
  clippedEnd: Date;
  height: number;
  yOffset: number;
}

interface TimelineLaneLayout {
  height: number;
  assignmentLayouts: Map<string, TimelineAssignmentLayout>;
}

interface TimelineLaneDefinition {
  id: string;
  assignments: Assignment[];
}

interface TimelineSectionDefinition<
  TLane extends TimelineLaneDefinition = TimelineLaneDefinition,
> {
  lanes: TLane[];
}

export function groupAndSortConsultants(
  consultants: Consultant[]
): ConsultantTimelineGroup[] {
  const groups = new Map<string, Consultant[]>();

  for (const consultant of consultants) {
    const existing = groups.get(consultant.practice_area) || [];
    existing.push(consultant);
    groups.set(consultant.practice_area, existing);
  }

  const result: ConsultantTimelineGroup[] = [];

  for (const [area, members] of groups) {
    members.sort(
      (a, b) =>
        (SENIORITY_ORDER[b.seniority_level] || 0) -
        (SENIORITY_ORDER[a.seniority_level] || 0)
    );

    result.push({
      practiceArea: area,
      label:
        PRACTICE_AREA_LABELS[area as keyof typeof PRACTICE_AREA_LABELS] || area,
      consultants: members,
    });
  }

  result.sort((a, b) => a.label.localeCompare(b.label));
  return result;
}

export function groupAssignmentsByKey(
  assignments: Assignment[],
  getKey: (assignment: Assignment) => string
) {
  const groupedAssignments = new Map<string, Assignment[]>();

  for (const assignment of assignments) {
    const key = getKey(assignment);
    const existing = groupedAssignments.get(key) || [];
    existing.push(assignment);
    groupedAssignments.set(key, existing);
  }

  return groupedAssignments;
}

export function buildLaneLayout(
  laneAssignments: Assignment[],
  viewStart: Date,
  viewEnd: Date
): TimelineLaneLayout {
  const visibleAssignments = laneAssignments
    .map((assignment) => {
      const assignmentStart = parseISO(assignment.start_date);
      const assignmentEnd = parseISO(assignment.end_date);

      if (assignmentEnd < viewStart || assignmentStart > viewEnd) {
        return null;
      }

      return {
        assignment,
        clippedStart: assignmentStart > viewStart ? assignmentStart : viewStart,
        clippedEnd: assignmentEnd < viewEnd ? assignmentEnd : viewEnd,
        height: (assignment.allocation_percentage / 100) * BASE_BLOCK_HEIGHT,
      };
    })
    .filter((assignment): assignment is NonNullable<typeof assignment> =>
      Boolean(assignment)
    )
    .sort((a, b) => {
      const startDiff = a.clippedStart.getTime() - b.clippedStart.getTime();
      if (startDiff !== 0) {
        return startDiff;
      }

      const heightDiff = b.height - a.height;
      if (heightDiff !== 0) {
        return heightDiff;
      }

      return a.clippedEnd.getTime() - b.clippedEnd.getTime();
    });

  const assignmentLayouts = new Map<string, TimelineAssignmentLayout>();
  let activeAssignments: Array<{
    clippedEnd: number;
    height: number;
    yOffset: number;
  }> = [];
  let maxContentHeight = BASE_BLOCK_HEIGHT;

  for (const visibleAssignment of visibleAssignments) {
    const assignmentStart = visibleAssignment.clippedStart.getTime();

    activeAssignments = activeAssignments
      .filter((placement) => placement.clippedEnd > assignmentStart)
      .sort((a, b) => a.yOffset - b.yOffset);

    let yOffset = 0;
    for (const placement of activeAssignments) {
      if (yOffset + visibleAssignment.height <= placement.yOffset) {
        break;
      }
      yOffset = placement.yOffset + placement.height;
    }

    assignmentLayouts.set(visibleAssignment.assignment.id, {
      clippedStart: visibleAssignment.clippedStart,
      clippedEnd: visibleAssignment.clippedEnd,
      height: visibleAssignment.height,
      yOffset,
    });

    activeAssignments.push({
      clippedEnd: visibleAssignment.clippedEnd.getTime(),
      height: visibleAssignment.height,
      yOffset,
    });

    maxContentHeight = Math.max(
      maxContentHeight,
      yOffset + visibleAssignment.height
    );
  }

  return {
    height: maxContentHeight + TIMELINE_BLOCK_PADDING * 2,
    assignmentLayouts,
  };
}

export function buildLaneLayouts<TLane extends TimelineLaneDefinition>(
  sections: TimelineSectionDefinition<TLane>[],
  viewStart: Date,
  viewEnd: Date
) {
  const laneLayouts = new Map<string, TimelineLaneLayout>();

  for (const section of sections) {
    for (const lane of section.lanes) {
      laneLayouts.set(lane.id, buildLaneLayout(lane.assignments, viewStart, viewEnd));
    }
  }

  return laneLayouts;
}
