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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import { ACTIVE_PIPELINE_STAGES } from '@/lib/types/opportunity';

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
  const activeView = useUIStore((s) => s.activeView);
  const isActualTimeline = activeView === 'actual-timeline';
  const isKnownBets = activeView === 'known-bets';
  const rawOverlayPref = useUIStore((s) => s.showOpportunityOverlay);
  // Actual timeline: never show overlay. Other views: respect user preference.
  const showOpportunityOverlay = rawOverlayPref && !isActualTimeline;
  const setShowOpportunityOverlay = useUIStore((s) => s.setShowOpportunityOverlay);
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const oppScenarios = useOpportunityStore((s) => s.scenarios);

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

  // ─── Synthetic bet assignments for Known + Bets view ──────────────
  const betAssignments = useMemo(() => {
    if (!isKnownBets) return [] as Assignment[];

    const betOpps = opportunities.filter((o) => o.is_bet && !['won', 'lost'].includes(o.stage));
    const synthetic: Assignment[] = [];

    for (const opp of betOpps) {
      const scenario =
        oppScenarios.find((s) => s.opportunity_id === opp.id && s.is_default) ||
        oppScenarios.find((s) => s.opportunity_id === opp.id);

      if (scenario) {
        for (const ta of scenario.tentative_assignments) {
          synthetic.push({
            id: `bet:${ta.id}`,
            consultant_id: ta.consultant_id,
            engagement_id: `bet-opp:${opp.id}`,
            role: ta.role,
            start_date: ta.start_date,
            end_date: ta.end_date,
            allocation_percentage: ta.allocation_percentage,
          });
        }
      } else {
        // No scenario — create a full-width placeholder per opportunity
        // (won't show on consultant lanes since no consultant_id mapping)
      }
    }

    return synthetic;
  }, [isKnownBets, opportunities, oppScenarios]);

  // Map of bet assignment IDs to their opportunity metadata (for rendering)
  const betMetadata = useMemo(() => {
    if (!isKnownBets) return new Map<string, { color: string; clientName: string; projectName: string; probability: number }>();

    const map = new Map<string, { color: string; clientName: string; projectName: string; probability: number }>();
    const betOpps = opportunities.filter((o) => o.is_bet && !['won', 'lost'].includes(o.stage));

    for (const opp of betOpps) {
      const scenario =
        oppScenarios.find((s) => s.opportunity_id === opp.id && s.is_default) ||
        oppScenarios.find((s) => s.opportunity_id === opp.id);

      if (scenario) {
        for (const ta of scenario.tentative_assignments) {
          map.set(`bet:${ta.id}`, {
            color: opp.color,
            clientName: opp.client_name,
            projectName: opp.project_name,
            probability: opp.probability,
          });
        }
      }
    }

    return map;
  }, [isKnownBets, opportunities, oppScenarios]);

  // Merge real assignments with bet synthetic assignments
  const allAssignments = useMemo(() => {
    if (!isKnownBets || betAssignments.length === 0) return assignments;
    return [...assignments, ...betAssignments];
  }, [assignments, betAssignments, isKnownBets]);

  const visibleAssignments = useMemo(() => {
    const source = isKnownBets ? allAssignments : assignments;
    if (!practiceAreaFilter) {
      return source;
    }

    return source.filter((assignment) => visibleConsultantIds.has(assignment.consultant_id));
  }, [allAssignments, assignments, isKnownBets, practiceAreaFilter, visibleConsultantIds]);

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
          const isBetAssignment = assignment.id.startsWith('bet:');
          const engagement = isBetAssignment ? null : engagementById.get(assignment.engagement_id);
          const betMeta = isBetAssignment ? betMetadata.get(assignment.id) : null;
          const consultant = consultantById.get(assignment.consultant_id);
          const assignmentLayout = laneLayout.assignmentLayouts.get(assignment.id);

          // Skip real assignments with no engagement, but allow bet assignments
          if (!assignmentLayout || (!engagement && !betMeta)) {
            continue;
          }

          const x = Math.max(0, xScale(assignmentLayout.clippedStart));
          const x2 = Math.min(chartWidth, xScale(assignmentLayout.clippedEnd));
          const width = Math.max(MIN_BLOCK_WIDTH, x2 - x);
          const blockY = laneY + BLOCK_PADDING + assignmentLayout.yOffset;
          const blockHeight = assignmentLayout.height;
          const blockColor = isBetAssignment ? (betMeta?.color ?? '#7C3AED') : engagement!.color;

          if (isBetAssignment && betMeta) {
            // ─── BET BLOCK: Distinct visual treatment ────────────────────
            const betGroup = svg.append('g').attr('class', 'bet-block');

            // Ensure bet stripe pattern exists in defs
            let defs = svg.select<SVGDefsElement>('defs');
            if (defs.empty()) {
              defs = svg.append('defs');
            }
            const patternId = `bet-stripes-${betMeta.color.replace('#', '')}`;
            if (defs.select(`#${patternId}`).empty()) {
              const pattern = defs
                .append('pattern')
                .attr('id', patternId)
                .attr('width', 8)
                .attr('height', 8)
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('patternTransform', 'rotate(45)');
              pattern
                .append('rect')
                .attr('width', 8)
                .attr('height', 8)
                .attr('fill', betMeta.color)
                .attr('fill-opacity', 0.18);
              pattern
                .append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', 8)
                .attr('stroke', betMeta.color)
                .attr('stroke-width', 3)
                .attr('stroke-opacity', 0.28);
            }

            // Background fill — muted version of the bet color
            betGroup
              .append('rect')
              .attr('x', x + 2)
              .attr('y', blockY)
              .attr('width', width - 4)
              .attr('height', blockHeight)
              .attr('rx', 6)
              .attr('ry', 6)
              .attr('fill', betMeta.color)
              .attr('fill-opacity', 0.12);

            // Diagonal stripe overlay
            betGroup
              .append('rect')
              .attr('x', x + 2)
              .attr('y', blockY)
              .attr('width', width - 4)
              .attr('height', blockHeight)
              .attr('rx', 6)
              .attr('ry', 6)
              .attr('fill', `url(#${patternId})`);

            // Dashed border
            betGroup
              .append('rect')
              .attr('x', x + 2)
              .attr('y', blockY)
              .attr('width', width - 4)
              .attr('height', blockHeight)
              .attr('rx', 6)
              .attr('ry', 6)
              .attr('fill', 'none')
              .attr('stroke', betMeta.color)
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '6,3')
              .attr('stroke-opacity', 0.65);

            // "BET" tag — small pill in top-right corner
            if (width > 50 && blockHeight >= 16) {
              const tagWidth = 28;
              const tagHeight = 12;
              const tagX = x + width - tagWidth - 8;
              const tagY = blockY + 4;

              betGroup
                .append('rect')
                .attr('x', tagX)
                .attr('y', tagY)
                .attr('width', tagWidth)
                .attr('height', tagHeight)
                .attr('rx', tagHeight / 2)
                .attr('ry', tagHeight / 2)
                .attr('fill', betMeta.color)
                .attr('fill-opacity', 0.85);

              betGroup
                .append('text')
                .attr('x', tagX + tagWidth / 2)
                .attr('y', tagY + tagHeight / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .attr('fill', 'white')
                .attr('font-size', '7px')
                .attr('font-weight', '700')
                .attr('letter-spacing', '0.5px')
                .attr('pointer-events', 'none')
                .text('BET');
            }

            // Primary label
            if (width > 60 && blockHeight >= 14) {
              const betLabel = width > 152
                ? `${betMeta.clientName} — ${betMeta.projectName}`
                : betMeta.clientName;

              appendTruncatedText(betGroup, {
                fill: betMeta.color,
                fontSize: blockHeight >= 20 ? '11px' : '10px',
                fontWeight: '600',
                maxWidth: width - (width > 50 && blockHeight >= 16 ? 44 : 16),
                text: betLabel,
                x: x + 10,
                y: blockHeight >= 24 ? blockY + 12 : blockY + blockHeight / 2 + 1,
              });
            }

            // Allocation label
            if (width > 112 && blockHeight >= 28) {
              betGroup
                .append('text')
                .attr('x', x + 10)
                .attr('y', blockY + blockHeight - 6)
                .attr('fill', betMeta.color)
                .attr('fill-opacity', 0.7)
                .attr('font-size', '9px')
                .attr('font-weight', '500')
                .attr('pointer-events', 'none')
                .text(`${assignment.allocation_percentage}% · ${betMeta.probability}% prob`);
            }
          } else if (engagement) {
            // ─── REAL BLOCK: Standard rendering ──────────────────────────
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
              .attr('fill', blockColor)
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
    betMetadata,
  ]);

  // ─── Opportunity Overlay (additive, separate render pass) ──────────────
  useEffect(() => {
    if (!svgRef.current || !showOpportunityOverlay || viewMode !== 'consultants') return;

    const svg = d3.select(svgRef.current);
    // Remove previous overlay elements only
    svg.selectAll('.opportunity-overlay').remove();

    if (sections.length === 0) return;

    const xScale = d3.scaleTime().domain([start, end]).range([0, chartWidth]);

    // Build a map of consultantId → y-position from the lane layout
    const consultantYPositions = new Map<string, { y: number; height: number }>();
    let currentY = 0;
    for (const section of sections) {
      currentY += GROUP_HEADER_HEIGHT;
      for (const lane of section.lanes) {
        const laneHeight = laneLayouts.get(lane.id)?.height || BASE_LANE_HEIGHT;
        if (lane.consultantId) {
          consultantYPositions.set(lane.consultantId, { y: currentY, height: laneHeight });
        }
        currentY += laneHeight;
      }
    }

    // Get active opportunities with their default scenarios
    const activeOpps = opportunities.filter((o) =>
      ACTIVE_PIPELINE_STAGES.includes(o.stage)
    );

    const overlayGroup = svg.append('g').attr('class', 'opportunity-overlay');

    // Add striped pattern for tentative blocks
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
    }
    if (defs.select('#tentative-stripes').empty()) {
      const pattern = defs
        .append('pattern')
        .attr('id', 'tentative-stripes')
        .attr('width', 6)
        .attr('height', 6)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('patternTransform', 'rotate(45)');
      pattern
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', 6)
        .attr('stroke', 'rgba(255,255,255,0.3)')
        .attr('stroke-width', 2);
    }

    for (const opp of activeOpps) {
      const defaultScenario =
        oppScenarios.find((s) => s.opportunity_id === opp.id && s.is_default) ||
        oppScenarios.find((s) => s.opportunity_id === opp.id);

      if (!defaultScenario) continue;

      for (const ta of defaultScenario.tentative_assignments) {
        const pos = consultantYPositions.get(ta.consultant_id);
        if (!pos) continue;

        const taStart = parseISO(ta.start_date);
        const taEnd = parseISO(ta.end_date);

        // Skip if outside view window
        if (taEnd < start || taStart > end) continue;

        const clippedStart = taStart > start ? taStart : start;
        const clippedEnd = taEnd < end ? taEnd : end;

        const x = Math.max(0, xScale(clippedStart));
        const x2 = Math.min(chartWidth, xScale(clippedEnd));
        const blockWidth = Math.max(MIN_BLOCK_WIDTH, x2 - x);

        // Scale height by allocation but use weighted opacity by probability
        const blockHeight = Math.max(
          12,
          (ta.allocation_percentage / 100) * BASE_BLOCK_HEIGHT * 0.6
        );
        const blockY = pos.y + pos.height - BLOCK_PADDING - blockHeight;
        const opacity = 0.25 + (opp.probability / 100) * 0.35;

        const blockGroup = overlayGroup.append('g');

        // Dashed border rectangle
        blockGroup
          .append('rect')
          .attr('x', x + 2)
          .attr('y', blockY)
          .attr('width', blockWidth - 4)
          .attr('height', blockHeight)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', opp.color)
          .attr('fill-opacity', opacity)
          .attr('stroke', opp.color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,3')
          .attr('stroke-opacity', 0.7)
          .attr('pointer-events', 'none');

        // Striped overlay
        blockGroup
          .append('rect')
          .attr('x', x + 2)
          .attr('y', blockY)
          .attr('width', blockWidth - 4)
          .attr('height', blockHeight)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', 'url(#tentative-stripes)')
          .attr('pointer-events', 'none');

        // Label if wide enough
        if (blockWidth > 70 && blockHeight >= 14) {
          const label = `${opp.client_name} (${opp.probability}%)`;
          appendTruncatedText(blockGroup, {
            fill: opp.color,
            fontSize: '9px',
            fontWeight: '600',
            maxWidth: blockWidth - 16,
            text: label,
            x: x + 8,
            y: blockY + blockHeight / 2 + 1,
          });
        }
      }
    }
  }, [
    chartWidth,
    end,
    laneLayouts,
    opportunities,
    oppScenarios,
    sections,
    showOpportunityOverlay,
    start,
    viewMode,
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
          {isKnownBets && viewMode === 'consultants' ? (
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-2.5 rounded-sm bg-indigo-500 opacity-90" />
                <span className="text-[10px] text-muted-foreground">Known</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-2.5 rounded-sm border border-dashed border-violet-500 bg-violet-500/15" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(139,92,246,0.15) 2px, rgba(139,92,246,0.15) 4px)' }} />
                <span className="text-[10px] text-muted-foreground">Bet</span>
              </div>
              <span className="text-[10px] text-violet-600 font-medium">
                {opportunities.filter((o) => o.is_bet && !['won', 'lost'].includes(o.stage)).length} bet{opportunities.filter((o) => o.is_bet && !['won', 'lost'].includes(o.stage)).length !== 1 ? 's' : ''} overlaid
              </span>
            </div>
          ) : viewMode === 'consultants' && !isKnownBets ? (
            <div className="flex items-center gap-1.5 ml-auto">
              <Switch
                id="opp-overlay"
                checked={showOpportunityOverlay}
                onCheckedChange={setShowOpportunityOverlay}
                disabled={isActualTimeline}
                className="scale-75"
              />
              <Label
                htmlFor="opp-overlay"
                className={`text-[11px] cursor-pointer whitespace-nowrap ${isActualTimeline ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
              >
                Show Pipeline
              </Label>
            </div>
          ) : null}
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
