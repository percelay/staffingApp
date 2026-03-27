'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { parseISO } from 'date-fns';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  allocationPercentageToManDays,
  formatAllocationAsManDays,
  formatManDaysPerWeek,
} from '@/lib/utils/allocation';
import { get12WeekWindow, getWeeksBetween, getWeekLabel } from '@/lib/utils/date-helpers';
import { getWeeklyAllocations } from '@/lib/utils/availability';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { SENIORITY_ORDER, PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import type { Consultant } from '@/lib/types/consultant';
import type { Assignment } from '@/lib/types/assignment';
import {
  ENGAGEMENT_STATUS_LABELS,
  type Engagement,
  type EngagementStatus,
} from '@/lib/types/engagement';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BASE_LANE_HEIGHT = 64;
const HEADER_WIDTH = 260;
const GROUP_HEADER_HEIGHT = 36;
const TOP_AXIS_HEIGHT = 48;
const BLOCK_PADDING = 6;
const MIN_BLOCK_WIDTH = 20;
const BASE_BLOCK_HEIGHT = BASE_LANE_HEIGHT - BLOCK_PADDING * 2;
const EFFORT_METER_SEGMENTS = 5;

const ENGAGEMENT_STATUS_ORDER: Record<EngagementStatus, number> = {
  active: 0,
  upcoming: 1,
  completed: 2,
};

type TimelineViewMode = 'consultants' | 'projects';

interface ConsultantGroup {
  practiceArea: string;
  label: string;
  consultants: Consultant[];
}

interface AssignmentLayout {
  clippedStart: Date;
  clippedEnd: Date;
  height: number;
  yOffset: number;
}

interface LaneLayout {
  height: number;
  assignmentLayouts: Map<string, AssignmentLayout>;
}

interface LanePlaceholder {
  color: string;
  end: Date;
  label: string;
  start: Date;
  variant: 'filled' | 'outline';
}

interface TimelineLane {
  id: string;
  title: string;
  subtitle: string;
  assignments: Assignment[];
  avatarUrl?: string;
  alertDot?: boolean;
  consultantId?: string;
  engagementId?: string;
  placeholder?: LanePlaceholder;
  swatchColor?: string;
}

interface TimelineSection {
  id: string;
  label: string;
  lanes: TimelineLane[];
}

function groupAndSortConsultants(consultants: Consultant[]): ConsultantGroup[] {
  const groups = new Map<string, Consultant[]>();

  for (const consultant of consultants) {
    const existing = groups.get(consultant.practice_area) || [];
    existing.push(consultant);
    groups.set(consultant.practice_area, existing);
  }

  const result: ConsultantGroup[] = [];

  for (const [area, members] of groups) {
    members.sort(
      (a, b) =>
        (SENIORITY_ORDER[b.seniority_level] || 0) -
        (SENIORITY_ORDER[a.seniority_level] || 0)
    );

    result.push({
      practiceArea: area,
      label: PRACTICE_AREA_LABELS[area as keyof typeof PRACTICE_AREA_LABELS] || area,
      consultants: members,
    });
  }

  result.sort((a, b) => a.label.localeCompare(b.label));
  return result;
}

function groupAssignmentsByKey(
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

function buildLaneLayout(
  laneAssignments: Assignment[],
  viewStart: Date,
  viewEnd: Date
): LaneLayout {
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
    .filter((assignment): assignment is NonNullable<typeof assignment> => Boolean(assignment))
    .sort((a, b) => {
      const startDiff = a.clippedStart.getTime() - b.clippedStart.getTime();
      if (startDiff !== 0) return startDiff;

      const heightDiff = b.height - a.height;
      if (heightDiff !== 0) return heightDiff;

      return a.clippedEnd.getTime() - b.clippedEnd.getTime();
    });

  const assignmentLayouts = new Map<string, AssignmentLayout>();
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

    maxContentHeight = Math.max(maxContentHeight, yOffset + visibleAssignment.height);
  }

  return {
    height: maxContentHeight + BLOCK_PADDING * 2,
    assignmentLayouts,
  };
}

function buildLaneLayouts(
  sections: TimelineSection[],
  viewStart: Date,
  viewEnd: Date
) {
  const laneLayouts = new Map<string, LaneLayout>();

  for (const section of sections) {
    for (const lane of section.lanes) {
      laneLayouts.set(lane.id, buildLaneLayout(lane.assignments, viewStart, viewEnd));
    }
  }

  return laneLayouts;
}

function appendTruncatedText(
  blockGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  {
    fill,
    fontSize,
    fontWeight,
    maxWidth,
    text,
    x,
    y,
  }: {
    fill: string;
    fontSize: string;
    fontWeight: string;
    maxWidth: number;
    text: string;
    x: number;
    y: number;
  }
) {
  blockGroup
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('dy', '0.35em')
    .attr('fill', fill)
    .attr('font-size', fontSize)
    .attr('font-weight', fontWeight)
    .attr('pointer-events', 'none')
    .text(text)
    .each(function () {
      const textEl = this as SVGTextElement;
      if (textEl.getComputedTextLength() <= maxWidth) {
        return;
      }

      let truncated = text;
      while (truncated.length > 0 && textEl.getComputedTextLength() > maxWidth) {
        truncated = truncated.slice(0, -1);
        textEl.textContent = `${truncated}…`;
      }
    });
}

function appendEffortMeter(
  blockGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  width: number,
  height: number,
  allocationPercentage: number
) {
  if (width < 84 || height < 12) {
    return;
  }

  const meterWidth = Math.min(56, width - 16);
  const segmentGap = 2;
  const segmentWidth =
    (meterWidth - segmentGap * (EFFORT_METER_SEGMENTS - 1)) / EFFORT_METER_SEGMENTS;
  const meterHeight = height >= 20 ? 5 : 4;
  const meterX = width >= 112 ? x + width - meterWidth - 8 : x + 8;
  const meterY = y + height - meterHeight - 5;
  const manDays = Math.max(0, Math.min(5, allocationPercentageToManDays(allocationPercentage)));
  const meterGroup = blockGroup.append('g').attr('pointer-events', 'none');

  for (let index = 0; index < EFFORT_METER_SEGMENTS; index += 1) {
    const segmentX = meterX + index * (segmentWidth + segmentGap);
    const filledPortion = Math.max(0, Math.min(1, manDays - index));

    meterGroup
      .append('rect')
      .attr('x', segmentX)
      .attr('y', meterY)
      .attr('width', segmentWidth)
      .attr('height', meterHeight)
      .attr('rx', meterHeight / 2)
      .attr('ry', meterHeight / 2)
      .attr('fill', 'rgba(255,255,255,0.18)');

    if (filledPortion > 0) {
      meterGroup
        .append('rect')
        .attr('x', segmentX)
        .attr('y', meterY)
        .attr('width', segmentWidth * filledPortion)
        .attr('height', meterHeight)
        .attr('rx', meterHeight / 2)
        .attr('ry', meterHeight / 2)
        .attr('fill', 'rgba(255,255,255,0.92)');
    }
  }
}

function sortEngagements(a: Engagement, b: Engagement) {
  const statusDiff =
    ENGAGEMENT_STATUS_ORDER[a.status] - ENGAGEMENT_STATUS_ORDER[b.status];
  if (statusDiff !== 0) {
    return statusDiff;
  }

  const startDiff =
    parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime();
  if (startDiff !== 0) {
    return startDiff;
  }

  const clientDiff = a.client_name.localeCompare(b.client_name);
  if (clientDiff !== 0) {
    return clientDiff;
  }

  return a.project_name.localeCompare(b.project_name);
}

export function SwimLaneChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);
  const [viewMode, setViewMode] = useState<TimelineViewMode>('consultants');

  const consultants = useConsultantStore((s) => s.consultants);
  const engagements = useEngagementStore((s) => s.engagements);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);
  const weekOffset = useUIStore((s) => s.timelineWeekOffset);
  const setWeekOffset = useUIStore((s) => s.setTimelineWeekOffset);
  const setSelectedEngagement = useUIStore((s) => s.setSelectedEngagementId);
  const setDrawerOpen = useUIStore((s) => s.setDrawerOpen);
  const currentUser = useAuthStore((s) => s.currentUser);

  const practiceAreaFilter =
    currentUser?.role === 'manager' ? currentUser.practice_area : null;

  const { start, end } = get12WeekWindow(weekOffset);

  const visibleConsultants = useMemo(() => {
    if (!practiceAreaFilter) {
      return consultants;
    }

    return consultants.filter((consultant) => consultant.practice_area === practiceAreaFilter);
  }, [consultants, practiceAreaFilter]);

  const consultantById = useMemo(
    () => new Map(consultants.map((consultant) => [consultant.id, consultant])),
    [consultants]
  );

  const engagementById = useMemo(
    () => new Map(engagements.map((engagement) => [engagement.id, engagement])),
    [engagements]
  );

  const visibleConsultantIds = useMemo(
    () => new Set(visibleConsultants.map((consultant) => consultant.id)),
    [visibleConsultants]
  );

  const visibleAssignments = useMemo(() => {
    if (!practiceAreaFilter) {
      return assignments;
    }

    return assignments.filter((assignment) => visibleConsultantIds.has(assignment.consultant_id));
  }, [assignments, practiceAreaFilter, visibleConsultantIds]);

  const burnoutByConsultantId = useMemo(() => {
    const burnoutMap = new Map<string, number>();

    for (const consultant of visibleConsultants) {
      burnoutMap.set(
        consultant.id,
        calculateBurnoutRisk(consultant.id, assignments, signals)
      );
    }

    return burnoutMap;
  }, [visibleConsultants, assignments, signals]);

  const consultantGroups = useMemo(
    () => groupAndSortConsultants(visibleConsultants),
    [visibleConsultants]
  );

  const assignedEngagementIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.engagement_id)),
    [assignments]
  );

  const visibleAssignedEngagementIds = useMemo(
    () => new Set(visibleAssignments.map((assignment) => assignment.engagement_id)),
    [visibleAssignments]
  );

  const unassignedEngagements = useMemo(
    () => engagements.filter((engagement) => !assignedEngagementIds.has(engagement.id)),
    [engagements, assignedEngagementIds]
  );

  const projectEngagements = useMemo(() => {
    const sortedEngagements = [...engagements].sort(sortEngagements);

    if (!practiceAreaFilter) {
      return sortedEngagements;
    }

    return sortedEngagements.filter(
      (engagement) =>
        visibleAssignedEngagementIds.has(engagement.id) ||
        !assignedEngagementIds.has(engagement.id)
    );
  }, [
    engagements,
    practiceAreaFilter,
    visibleAssignedEngagementIds,
    assignedEngagementIds,
  ]);

  const consultantSections = useMemo(() => {
    const assignmentsByConsultant = groupAssignmentsByKey(
      visibleAssignments,
      (assignment) => assignment.consultant_id
    );

    const sections: TimelineSection[] = consultantGroups.map((group) => ({
      id: `practice-area:${group.practiceArea}`,
      label: group.label,
      lanes: group.consultants.map((consultant) => ({
        id: `consultant:${consultant.id}`,
        alertDot: (burnoutByConsultantId.get(consultant.id) || 0) >= 60,
        assignments: assignmentsByConsultant.get(consultant.id) || [],
        avatarUrl: consultant.avatar_url,
        consultantId: consultant.id,
        subtitle: consultant.role,
        title: consultant.name,
      })),
    }));

    if (unassignedEngagements.length > 0) {
      sections.push({
        id: 'unassigned-engagements',
        label: 'Unassigned',
        lanes: unassignedEngagements.map((engagement) => ({
          id: `unassigned:${engagement.id}`,
          assignments: [],
          engagementId: engagement.id,
          placeholder: {
            color: engagement.color,
            end: parseISO(engagement.end_date),
            label: 'Unassigned',
            start: parseISO(engagement.start_date),
            variant: 'filled',
          },
          subtitle: engagement.project_name,
          swatchColor: engagement.color,
          title: engagement.client_name,
        })),
      });
    }

    return sections;
  }, [burnoutByConsultantId, consultantGroups, unassignedEngagements, visibleAssignments]);

  const projectSections = useMemo(() => {
    const assignmentsByEngagement = groupAssignmentsByKey(
      visibleAssignments,
      (assignment) => assignment.engagement_id
    );

    const engagementsByStatus = new Map<EngagementStatus, Engagement[]>();

    for (const engagement of projectEngagements) {
      const existing = engagementsByStatus.get(engagement.status) || [];
      existing.push(engagement);
      engagementsByStatus.set(engagement.status, existing);
    }

    return (Object.keys(ENGAGEMENT_STATUS_ORDER) as EngagementStatus[])
      .map((status) => {
        const statusEngagements = engagementsByStatus.get(status) || [];
        const lanes: TimelineLane[] = statusEngagements.map((engagement) => {
          const laneAssignments = assignmentsByEngagement.get(engagement.id) || [];
          const assignedCount = laneAssignments.length;
          const totalManDays = allocationPercentageToManDays(
            laneAssignments.reduce(
              (total, assignment) => total + assignment.allocation_percentage,
              0
            )
          );

          return {
            id: `engagement:${engagement.id}`,
            assignments: laneAssignments,
            engagementId: engagement.id,
            placeholder:
              assignedCount === 0
                ? {
                    color: engagement.color,
                    end: parseISO(engagement.end_date),
                    label: 'No consultants assigned',
                    start: parseISO(engagement.start_date),
                    variant: 'outline',
                  }
                : undefined,
            subtitle:
              assignedCount === 0
                ? `${engagement.client_name} · Unstaffed`
                : `${engagement.client_name} · ${
                    assignedCount === 1 ? '1 consultant' : `${assignedCount} consultants`
                  } · ${formatManDaysPerWeek(totalManDays, 'compact')} total`,
            swatchColor: engagement.color,
            title: engagement.project_name,
          };
        });

        return {
          id: `status:${status}`,
          label: ENGAGEMENT_STATUS_LABELS[status],
          lanes,
        };
      })
      .filter((section) => section.lanes.length > 0);
  }, [projectEngagements, visibleAssignments]);

  const sections = viewMode === 'consultants' ? consultantSections : projectSections;

  const weeks = useMemo(() => getWeeksBetween(start, end), [start, end]);

  const chartWidth = Math.max(containerWidth - HEADER_WIDTH, weeks.length * 80);

  const laneLayouts = useMemo(
    () => buildLaneLayouts(sections, start, end),
    [sections, start, end]
  );

  const totalHeight = useMemo(() => {
    return sections.reduce((height, section) => {
      const laneHeight = section.lanes.reduce(
        (sectionHeight, lane) =>
          sectionHeight + (laneLayouts.get(lane.id)?.height || BASE_LANE_HEIGHT),
        0
      );

      return height + GROUP_HEADER_HEIGHT + laneHeight;
    }, 0);
  }, [laneLayouts, sections]);

  const openEngagement = (engagementId: string) => {
    setSelectedEngagement(engagementId);
    setDrawerOpen(true);
  };

  useEffect(() => {
    const container = scrollRef.current?.parentElement;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (sections.length === 0) return;

    const xScale = d3.scaleTime().domain([start, end]).range([0, chartWidth]);

    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'block-shadow');
    filter
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 1)
      .attr('stdDeviation', 2)
      .attr('flood-opacity', 0.15);

    const gridGroup = svg.append('g').attr('class', 'grid');

    for (const week of weeks) {
      const x = xScale(week);
      gridGroup
        .append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', totalHeight)
        .attr('stroke', '#f1f5f9')
        .attr('stroke-width', 1);
    }

    const now = new Date();
    if (now >= start && now <= end) {
      const nowX = xScale(now);
      gridGroup
        .append('line')
        .attr('x1', nowX)
        .attr('y1', 0)
        .attr('x2', nowX)
        .attr('y2', totalHeight)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', 0.5);
    }

    let currentY = 0;

    for (const section of sections) {
      currentY += GROUP_HEADER_HEIGHT;

      for (const lane of section.lanes) {
        const laneY = currentY;
        const laneLayout = laneLayouts.get(lane.id) || {
          height: BASE_LANE_HEIGHT,
          assignmentLayouts: new Map<string, AssignmentLayout>(),
        };
        const laneHeight = laneLayout.height;

        if (lane.consultantId) {
          const allocations = getWeeklyAllocations(
            lane.consultantId,
            visibleAssignments,
            start,
            end
          );

          for (const allocation of allocations) {
            if (allocation.allocation >= 40) {
              continue;
            }

            const weekX = xScale(allocation.weekStart);
            const weekWidth = chartWidth / weeks.length;

            svg
              .append('rect')
              .attr('x', weekX)
              .attr('y', laneY)
              .attr('width', weekWidth)
              .attr('height', laneHeight)
              .attr('fill', 'rgba(34, 197, 94, 0.08)')
              .attr('class', 'animate-glow-green')
              .attr('pointer-events', 'none');
          }
        }

        svg
          .append('line')
          .attr('x1', 0)
          .attr('y1', laneY + laneHeight)
          .attr('x2', chartWidth)
          .attr('y2', laneY + laneHeight)
          .attr('stroke', '#f1f5f9')
          .attr('stroke-width', 1);

        if (lane.placeholder) {
          const placeholderStart = lane.placeholder.start;
          const placeholderEnd = lane.placeholder.end;

          if (!(placeholderEnd < start || placeholderStart > end)) {
            const x = Math.max(0, xScale(placeholderStart));
            const x2 = Math.min(chartWidth, xScale(placeholderEnd));
            const width = Math.max(MIN_BLOCK_WIDTH, x2 - x);
            const placeholderGroup = svg.append('g').attr('class', 'placeholder-block');

            placeholderGroup
              .append('rect')
              .attr('x', x + 2)
              .attr('y', laneY + BLOCK_PADDING)
              .attr('width', width - 4)
              .attr('height', BASE_BLOCK_HEIGHT)
              .attr('rx', 6)
              .attr('ry', 6)
              .attr('fill', lane.placeholder.color)
              .attr('fill-opacity', lane.placeholder.variant === 'filled' ? 0.72 : 0.08)
              .attr('stroke', lane.placeholder.color)
              .attr('stroke-width', lane.placeholder.variant === 'filled' ? 0 : 1.5)
              .attr('stroke-dasharray', lane.placeholder.variant === 'outline' ? '6,4' : null)
              .attr('cursor', lane.engagementId ? 'pointer' : 'default')
              .attr('filter', 'url(#block-shadow)')
              .on('mouseenter', function () {
                d3.select(this)
                  .transition()
                  .duration(150)
                  .attr(
                    'fill-opacity',
                    lane.placeholder?.variant === 'filled' ? 0.88 : 0.14
                  )
                  .attr(
                    'stroke-width',
                    lane.placeholder?.variant === 'filled' ? 0 : 2
                  );
              })
              .on('mouseleave', function () {
                d3.select(this)
                  .transition()
                  .duration(150)
                  .attr(
                    'fill-opacity',
                    lane.placeholder?.variant === 'filled' ? 0.72 : 0.08
                  )
                  .attr(
                    'stroke-width',
                    lane.placeholder?.variant === 'filled' ? 0 : 1.5
                  );
              })
              .on('click', () => {
                if (lane.engagementId) {
                  setSelectedEngagement(lane.engagementId);
                  setDrawerOpen(true);
                }
              });

            if (width > 90) {
              appendTruncatedText(placeholderGroup, {
                fill:
                  lane.placeholder.variant === 'filled'
                    ? 'white'
                    : 'rgba(15, 23, 42, 0.78)',
                fontSize: '11px',
                fontWeight: '600',
                maxWidth: width - 20,
                text: lane.placeholder.label,
                x: x + 10,
                y: laneY + BASE_LANE_HEIGHT / 2 + 1,
              });
            }
          }
        }

        for (const assignment of lane.assignments) {
          const engagement = engagementById.get(assignment.engagement_id);
          const consultant = consultantById.get(assignment.consultant_id);
          const assignmentLayout = laneLayout.assignmentLayouts.get(assignment.id);

          if (!engagement || !assignmentLayout) {
            continue;
          }

          const x = Math.max(0, xScale(assignmentLayout.clippedStart));
          const x2 = Math.min(chartWidth, xScale(assignmentLayout.clippedEnd));
          const width = Math.max(MIN_BLOCK_WIDTH, x2 - x);
          const blockY = laneY + BLOCK_PADDING + assignmentLayout.yOffset;
          const blockHeight = assignmentLayout.height;
          const blockGroup = svg.append('g').attr('class', 'engagement-block');
          const opacity = 0.92;
          const primaryLabel =
            viewMode === 'projects'
              ? consultant
                ? width > 152
                  ? `${consultant.name} — ${consultant.role}`
                  : consultant.name
                : 'Unassigned consultant'
              : width > 152
                ? `${engagement.client_name} — ${engagement.project_name}`
                : engagement.client_name;

          blockGroup
            .append('rect')
            .attr('x', x + 2)
            .attr('y', blockY)
            .attr('width', width - 4)
            .attr('height', blockHeight)
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', engagement.color)
            .attr('opacity', opacity)
            .attr('cursor', 'pointer')
            .attr('filter', 'url(#block-shadow)')
            .on('mouseenter', function () {
              d3.select(this)
                .transition()
                .duration(150)
                .attr('opacity', Math.min(1, opacity + 0.08))
                .attr('stroke', 'rgba(255,255,255,0.85)')
                .attr('stroke-width', 1.5);
            })
            .on('mouseleave', function () {
              d3.select(this)
                .transition()
                .duration(150)
                .attr('opacity', opacity)
                .attr('stroke-width', 0);
            })
            .on('click', () => {
              setSelectedEngagement(engagement.id);
              setDrawerOpen(true);
            });

          if (width > 60 && blockHeight >= 14) {
            appendTruncatedText(blockGroup, {
              fill: 'white',
              fontSize: blockHeight >= 20 ? '11px' : '10px',
              fontWeight: '500',
              maxWidth: width - 20,
              text: primaryLabel,
              x: x + 10,
              y: blockHeight >= 24 ? blockY + 12 : blockY + blockHeight / 2 + 1,
            });
          }

          if (width > 112 && blockHeight >= 22) {
            blockGroup
              .append('text')
              .attr('x', x + width - 8)
              .attr('y', blockY + 12)
              .attr('text-anchor', 'end')
              .attr('fill', 'rgba(255,255,255,0.82)')
              .attr('font-size', '9px')
              .attr('font-weight', '600')
              .attr('pointer-events', 'none')
              .text(formatAllocationAsManDays(assignment.allocation_percentage, 'compact'));
          }

          appendEffortMeter(
            blockGroup,
            x,
            blockY,
            width,
            blockHeight,
            assignment.allocation_percentage
          );
        }

        currentY += laneHeight;
      }
    }
  }, [
    chartWidth,
    consultantById,
    engagementById,
    end,
    laneLayouts,
    sections,
    start,
    totalHeight,
    viewMode,
    visibleAssignments,
    weeks,
    setDrawerOpen,
    setSelectedEngagement,
  ]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <div className="flex flex-col gap-2 px-4 py-2 border-b bg-white">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 4)}
          >
            ← Earlier
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {getWeekLabel(start)} — {getWeekLabel(end)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 4)}
          >
            Later →
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Timeline View
          </span>
          <Select
            value={viewMode}
            onValueChange={(value) => {
              startTransition(() => {
                setViewMode(value as TimelineViewMode);
              });
            }}
          >
            <SelectTrigger className="w-full max-w-[220px] h-8 text-xs bg-white">
              <SelectValue placeholder="Consultant View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultants">Consultant View</SelectItem>
              <SelectItem value="projects">Project View</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className={weekOffset === 0 ? 'opacity-50' : ''}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="flex border-b bg-slate-50/50" style={{ minHeight: TOP_AXIS_HEIGHT }}>
        <div
          className="shrink-0 flex items-end px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r bg-white"
          style={{ width: HEADER_WIDTH }}
        >
          {viewMode === 'consultants' ? 'Consultants' : 'Projects'}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex" style={{ width: chartWidth }}>
            {weeks.map((week) => (
              <div
                key={week.toISOString()}
                className="flex items-end pb-2 text-[11px] text-muted-foreground font-medium"
                style={{ width: chartWidth / weeks.length }}
              >
                <span className="px-2">{getWeekLabel(week)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="flex" style={{ minWidth: chartWidth + HEADER_WIDTH }}>
          <div
            className="shrink-0 sticky left-0 z-10 border-r bg-white"
            style={{ width: HEADER_WIDTH }}
          >
            {sections.map((section) => {
              const items = [
                <div
                  key={`section-${section.id}`}
                  className="flex items-center px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50 border-b"
                  style={{ height: GROUP_HEADER_HEIGHT }}
                >
                  {section.label}
                </div>,
              ];

              for (const lane of section.lanes) {
                const laneHeight = laneLayouts.get(lane.id)?.height || BASE_LANE_HEIGHT;
                const isClickable = Boolean(lane.engagementId);

                items.push(
                  <div
                    key={lane.id}
                    className={`flex items-center gap-3 px-4 border-b border-slate-100 transition-colors ${
                      isClickable ? 'hover:bg-slate-50/50 cursor-pointer' : 'hover:bg-slate-50/50'
                    }`}
                    style={{ height: laneHeight }}
                    onClick={() => {
                      if (lane.engagementId) {
                        openEngagement(lane.engagementId);
                      }
                    }}
                  >
                    {lane.avatarUrl ? (
                      <img
                        src={lane.avatarUrl}
                        alt={lane.title}
                        className="h-8 w-8 rounded-full bg-slate-100"
                      />
                    ) : lane.swatchColor ? (
                      <div
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: lane.swatchColor }}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate leading-tight">
                        {lane.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {lane.subtitle}
                      </p>
                    </div>
                    {lane.alertDot && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                  </div>
                );
              }

              return items;
            })}
          </div>

          <div className="flex-1">
            <svg
              ref={svgRef}
              width={chartWidth}
              height={totalHeight}
              className="block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
