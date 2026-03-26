'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { parseISO } from 'date-fns';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatManDaysPerWeek, getEngagementManDaysPerWeek } from '@/lib/utils/allocation';
import { get12WeekWindow, getWeeksBetween, getWeekLabel } from '@/lib/utils/date-helpers';
import { getWeeklyAllocations } from '@/lib/utils/availability';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { SENIORITY_ORDER, PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import type { Consultant } from '@/lib/types/consultant';
import type { Assignment } from '@/lib/types/assignment';
import { Button } from '@/components/ui/button';

const BASE_LANE_HEIGHT = 64;
const HEADER_WIDTH = 220;
const GROUP_HEADER_HEIGHT = 36;
const TOP_AXIS_HEIGHT = 48;
const BLOCK_PADDING = 6;
const MIN_BLOCK_WIDTH = 20;
const BASE_BLOCK_HEIGHT = BASE_LANE_HEIGHT - BLOCK_PADDING * 2;

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

interface ConsultantLaneLayout {
  height: number;
  assignmentLayouts: Map<string, AssignmentLayout>;
}

function groupAndSortConsultants(
  consultants: Consultant[],
  practiceAreaFilter: string | null
): ConsultantGroup[] {
  let filtered = consultants;
  if (practiceAreaFilter) {
    filtered = consultants.filter((c) => c.practice_area === practiceAreaFilter);
  }

  const groups = new Map<string, Consultant[]>();
  for (const c of filtered) {
    const existing = groups.get(c.practice_area) || [];
    existing.push(c);
    groups.set(c.practice_area, existing);
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

function buildConsultantLaneLayout(
  consultantAssignments: Assignment[],
  viewStart: Date,
  viewEnd: Date
): ConsultantLaneLayout {
  const visibleAssignments = consultantAssignments
    .map((assignment) => {
      const assignmentStart = parseISO(assignment.start_date);
      const assignmentEnd = parseISO(assignment.end_date);

      if (assignmentEnd < viewStart || assignmentStart > viewEnd) {
        return null;
      }

      return {
        assignment,
        clippedStart:
          assignmentStart > viewStart ? assignmentStart : viewStart,
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

  // Pack visible assignments into the lowest available vertical slot so overlaps stack.
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
    height: maxContentHeight + BLOCK_PADDING * 2,
    assignmentLayouts,
  };
}

function groupAssignmentsByConsultant(assignments: Assignment[]) {
  const assignmentsByConsultant = new Map<string, Assignment[]>();

  for (const assignment of assignments) {
    const consultantAssignments =
      assignmentsByConsultant.get(assignment.consultant_id) || [];
    consultantAssignments.push(assignment);
    assignmentsByConsultant.set(assignment.consultant_id, consultantAssignments);
  }

  return assignmentsByConsultant;
}

function buildConsultantLaneLayouts(
  groups: ConsultantGroup[],
  assignmentsByConsultant: Map<string, Assignment[]>,
  viewStart: Date,
  viewEnd: Date
) {
  const consultantLaneLayouts = new Map<string, ConsultantLaneLayout>();

  for (const group of groups) {
    for (const consultant of group.consultants) {
      consultantLaneLayouts.set(
        consultant.id,
        buildConsultantLaneLayout(
          assignmentsByConsultant.get(consultant.id) || [],
          viewStart,
          viewEnd
        )
      );
    }
  }

  return consultantLaneLayouts;
}

export function SwimLaneChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

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

  const groups = groupAndSortConsultants(consultants, practiceAreaFilter);

  const assignedEngagementIds = new Set(assignments.map((a) => a.engagement_id));
  const unassignedEngagements = engagements.filter((e) => !assignedEngagementIds.has(e.id));
  const { start, end } = get12WeekWindow(weekOffset);
  const weeks = getWeeksBetween(start, end);
  const chartWidth = Math.max(containerWidth - HEADER_WIDTH, weeks.length * 80);
  const assignmentsByConsultant = groupAssignmentsByConsultant(assignments);
  const consultantLaneLayouts = buildConsultantLaneLayouts(
    groups,
    assignmentsByConsultant,
    start,
    end
  );

  // Calculate total height
  let totalHeight = 0;
  for (const group of groups) {
    totalHeight += GROUP_HEADER_HEIGHT;
    totalHeight += group.consultants.reduce((height, consultant) => {
      return (
        height +
        (consultantLaneLayouts.get(consultant.id)?.height || BASE_LANE_HEIGHT)
      );
    }, 0);
  }
  if (unassignedEngagements.length > 0) {
    totalHeight += GROUP_HEADER_HEIGHT;
    totalHeight += unassignedEngagements.length * BASE_LANE_HEIGHT;
  }

  // Resize observer
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

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current) return;
    if (consultants.length === 0 && unassignedEngagements.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const effectAssignmentsByConsultant = groupAssignmentsByConsultant(assignments);
    const effectConsultantLaneLayouts = buildConsultantLaneLayouts(
      groups,
      effectAssignmentsByConsultant,
      start,
      end
    );
    const engagementManDaysById = new Map<string, number>();
    for (const engagement of engagements) {
      engagementManDaysById.set(
        engagement.id,
        getEngagementManDaysPerWeek(engagement.id, assignments)
      );
    }

    const xScale = d3
      .scaleTime()
      .domain([start, end])
      .range([0, chartWidth]);

    // Defs for gradients and filters
    const defs = svg.append('defs');

    // Drop shadow filter
    const filter = defs.append('filter').attr('id', 'block-shadow');
    filter
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 1)
      .attr('stdDeviation', 2)
      .attr('flood-opacity', 0.15);

    // Background grid lines (week columns)
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

    // Current week indicator
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

    // Render each lane
    let currentY = 0;
    for (const group of groups) {
      // Practice area group header
      currentY += GROUP_HEADER_HEIGHT;

      for (const consultant of group.consultants) {
        const laneY = currentY;
        const laneLayout =
          effectConsultantLaneLayouts.get(consultant.id) || {
            height: BASE_LANE_HEIGHT,
            assignmentLayouts: new Map<string, AssignmentLayout>(),
          };
        const laneHeight = laneLayout.height;

        // Burnout heat wash
        const burnoutScore = calculateBurnoutRisk(
          consultant.id,
          assignments,
          signals
        );
        if (burnoutScore > 30) {
          // Full lane background wash — intensity proportional to burnout score
          const baseIntensity = Math.min(0.15, (burnoutScore / 100) * 0.18);
          svg
            .append('rect')
            .attr('x', 0)
            .attr('y', laneY)
            .attr('width', chartWidth)
            .attr('height', laneHeight)
            .attr('fill', `rgba(239, 68, 68, ${baseIntensity})`)
            .attr('pointer-events', 'none');

          // Per-week intensity overlay for high-allocation weeks
          const burnoutAllocations = getWeeklyAllocations(
            consultant.id,
            assignments,
            start,
            end
          );
          for (const alloc of burnoutAllocations) {
            if (alloc.allocation > 80) {
              const weekX = xScale(alloc.weekStart);
              const weekWidth = chartWidth / weeks.length;
              const weekIntensity = Math.min(
                0.12,
                ((alloc.allocation - 80) / 100) * 0.15
              );
              svg
                .append('rect')
                .attr('x', weekX)
                .attr('y', laneY)
                .attr('width', weekWidth)
                .attr('height', laneHeight)
                .attr('fill', `rgba(239, 68, 68, ${weekIntensity})`)
                .attr('pointer-events', 'none');
            }
          }
        }

        // Availability glow (green for available weeks)
        const allocations = getWeeklyAllocations(
          consultant.id,
          assignments,
          start,
          end
        );
        for (const alloc of allocations) {
          if (alloc.allocation < 40) {
            const weekX = xScale(alloc.weekStart);
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

        // Lane bottom border
        svg
          .append('line')
          .attr('x1', 0)
          .attr('y1', laneY + laneHeight)
          .attr('x2', chartWidth)
          .attr('y2', laneY + laneHeight)
          .attr('stroke', '#f1f5f9')
          .attr('stroke-width', 1);

        // Engagement blocks for this consultant
        const consultantAssignments =
          effectAssignmentsByConsultant.get(consultant.id) || [];

        for (const assignment of consultantAssignments) {
          const engagement = engagements.find(
            (e) => e.id === assignment.engagement_id
          );
          if (!engagement) continue;

          const assignmentLayout = laneLayout.assignmentLayouts.get(assignment.id);
          if (!assignmentLayout) continue;

          const x = Math.max(0, xScale(assignmentLayout.clippedStart));
          const x2 = Math.min(chartWidth, xScale(assignmentLayout.clippedEnd));
          const width = Math.max(MIN_BLOCK_WIDTH, x2 - x);
          const blockY = laneY + BLOCK_PADDING + assignmentLayout.yOffset;
          const blockHeight = assignmentLayout.height;

          const blockGroup = svg.append('g').attr('class', 'engagement-block');

          const opacity = 0.92;

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

          // Text label
          if (width > 60 && blockHeight >= 18) {
            const label =
              width > 140
                ? `${engagement.client_name} — ${engagement.project_name}`
                : engagement.client_name;

            blockGroup
              .append('text')
              .attr('x', x + 10)
              .attr('y', blockY + blockHeight / 2 + 1)
              .attr('dy', '0.35em')
              .attr('fill', 'white')
              .attr('font-size', '11px')
              .attr('font-weight', '500')
              .attr('pointer-events', 'none')
              .text(label)
              .each(function () {
                const textEl = this as SVGTextElement;
                const maxWidth = width - 20;
                if (textEl.getComputedTextLength() > maxWidth) {
                  let text = label;
                  while (
                    textEl.getComputedTextLength() > maxWidth &&
                    text.length > 0
                  ) {
                    text = text.slice(0, -1);
                    textEl.textContent = text + '…';
                  }
                }
              });
          }

          // Project effort badge
          if (width > 72 && blockHeight >= 12) {
            blockGroup
              .append('text')
              .attr('x', x + width - 8)
              .attr('y', blockY + 12)
              .attr('text-anchor', 'end')
              .attr('fill', 'rgba(255,255,255,0.8)')
              .attr('font-size', '9px')
              .attr('font-weight', '600')
              .attr('pointer-events', 'none')
              .text(
                formatManDaysPerWeek(
                  engagementManDaysById.get(engagement.id) || 0,
                  'compact'
                )
              );
          }
        }

        currentY += laneHeight;
      }
    }

    // Unassigned Projects section
    if (unassignedEngagements.length > 0) {
      currentY += GROUP_HEADER_HEIGHT;

      for (const engagement of unassignedEngagements) {
        const laneY = currentY;

        svg
          .append('line')
          .attr('x1', 0)
          .attr('y1', laneY + BASE_LANE_HEIGHT)
          .attr('x2', chartWidth)
          .attr('y2', laneY + BASE_LANE_HEIGHT)
          .attr('stroke', '#f1f5f9')
          .attr('stroke-width', 1);

        const blockStart = parseISO(engagement.start_date);
        const blockEnd = parseISO(engagement.end_date);

        if (!(blockEnd < start || blockStart > end)) {
          const x = Math.max(0, xScale(blockStart));
          const x2 = Math.min(chartWidth, xScale(blockEnd));
          const width = Math.max(MIN_BLOCK_WIDTH, x2 - x);
          const blockGroup = svg.append('g').attr('class', 'engagement-block');

          blockGroup
            .append('rect')
            .attr('x', x + 2)
            .attr('y', laneY + BLOCK_PADDING)
            .attr('width', width - 4)
            .attr('height', BASE_BLOCK_HEIGHT)
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', engagement.color)
            .attr('opacity', 0.7)
            .attr('cursor', 'pointer')
            .attr('filter', 'url(#block-shadow)')
            .on('mouseenter', function () {
              d3.select(this).transition().duration(150)
                .attr('opacity', 0.9)
                .attr('y', laneY + BLOCK_PADDING - 1)
                .attr('height', BASE_BLOCK_HEIGHT + 2);
            })
            .on('mouseleave', function () {
              d3.select(this).transition().duration(150)
                .attr('opacity', 0.7)
                .attr('y', laneY + BLOCK_PADDING)
                .attr('height', BASE_BLOCK_HEIGHT);
            })
            .on('click', () => {
              setSelectedEngagement(engagement.id);
              setDrawerOpen(true);
            });

          if (width > 60) {
            const label =
              width > 140
                ? `${engagement.client_name} — ${engagement.project_name}`
                : engagement.client_name;

            blockGroup
              .append('text')
              .attr('x', x + 10)
              .attr('y', laneY + BASE_LANE_HEIGHT / 2 + 1)
              .attr('dy', '0.35em')
              .attr('fill', 'white')
              .attr('font-size', '11px')
              .attr('font-weight', '500')
              .attr('pointer-events', 'none')
              .text(label);
          }
        }

        currentY += BASE_LANE_HEIGHT;
      }
    }
  }, [
    consultants,
    engagements,
    assignments,
    unassignedEngagements,
    signals,
    weekOffset,
    chartWidth,
    start,
    end,
    weeks,
    groups,
    totalHeight,
    setSelectedEngagement,
    setDrawerOpen,
  ]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset(0)}
          className={weekOffset === 0 ? 'opacity-50' : ''}
        >
          Today
        </Button>
      </div>

      {/* Time axis header */}
      <div className="flex border-b bg-slate-50/50" style={{ minHeight: TOP_AXIS_HEIGHT }}>
        <div
          className="shrink-0 flex items-end px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r bg-white"
          style={{ width: HEADER_WIDTH }}
        >
          Consultants
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex" style={{ width: chartWidth }}>
            {weeks.map((week, i) => (
              <div
                key={i}
                className="flex items-end pb-2 text-[11px] text-muted-foreground font-medium"
                style={{ width: chartWidth / weeks.length }}
              >
                <span className="px-2">{getWeekLabel(week)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chart area — single scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto"
      >
        <div className="flex" style={{ minWidth: chartWidth + HEADER_WIDTH }}>
          {/* Lane headers (sticky left) */}
          <div
            ref={headerRef}
            className="shrink-0 sticky left-0 z-10 border-r bg-white"
            style={{ width: HEADER_WIDTH }}
          >
            {groups.map((group) => {
              const items: React.ReactNode[] = [];

              // Group header
              items.push(
                <div
                  key={`group-${group.practiceArea}`}
                  className="flex items-center px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50 border-b"
                  style={{ height: GROUP_HEADER_HEIGHT }}
                >
                  {group.label}
                </div>
              );

              // Consultant lanes
              for (const consultant of group.consultants) {
                const burnout = calculateBurnoutRisk(
                  consultant.id,
                  assignments,
                  signals
                );
                items.push(
                  <div
                    key={consultant.id}
                    className="flex items-center gap-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    style={{
                      height:
                        consultantLaneLayouts.get(consultant.id)?.height ||
                        BASE_LANE_HEIGHT,
                    }}
                  >
                    <img
                      src={consultant.avatar_url}
                      alt={consultant.name}
                      className="h-8 w-8 rounded-full bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate leading-tight">
                        {consultant.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {consultant.role}
                      </p>
                    </div>
                    {burnout >= 60 && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                  </div>
                );
              }

              return items;
            })}
          {unassignedEngagements.length > 0 && (
            <>
              <div
                className="flex items-center px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-slate-50 border-b"
                style={{ height: GROUP_HEADER_HEIGHT }}
              >
                Unassigned
              </div>
              {unassignedEngagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="flex items-center gap-3 px-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  style={{ height: BASE_LANE_HEIGHT }}
                  onClick={() => { setSelectedEngagement(engagement.id); setDrawerOpen(true); }}
                >
                  <div
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: engagement.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate leading-tight">
                      {engagement.client_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {engagement.project_name}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
          </div>

          {/* SVG chart */}
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
