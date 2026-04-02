'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Assignment } from '@/lib/types/assignment';
import type { Consultant } from '@/lib/types/consultant';
import { PRACTICE_AREA_LABELS, SENIORITY_LABELS } from '@/lib/types/consultant';
import { getAverageAvailability, getWeeklyAllocations } from '@/lib/utils/availability';
import { datesOverlap, getWeekLabel, isWithinRange } from '@/lib/utils/date-helpers';
import { cn } from '@/lib/utils';

export interface StaffingWindow {
  projectName: string;
  startDate: string;
  endDate: string;
  requiredSkills: string[];
  excludeEngagementId?: string;
}

export interface StaffingProjectSummary {
  id: string;
  client_name: string;
  project_name: string;
  color: string;
}

interface AvailableStaffingConsultantCardProps {
  consultant: Consultant;
  staffingWindow: StaffingWindow;
  allAssignments: Assignment[];
  allEngagements: StaffingProjectSummary[];
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export function AvailableStaffingConsultantCard({
  consultant,
  staffingWindow,
  allAssignments,
  allEngagements,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: AvailableStaffingConsultantCardProps) {
  const skillMatch = getConsultantMatches(
    consultant.skills,
    staffingWindow.requiredSkills
  );
  const goalMatch = getConsultantMatches(
    consultant.goals,
    staffingWindow.requiredSkills
  );

  return (
    <div
      className={cn(
        'border-b last:border-b-0 transition-colors',
        isSelected
          ? 'border-l-2 border-l-primary bg-primary/5'
          : isExpanded
            ? 'bg-slate-50/90'
            : 'hover:bg-slate-50'
      )}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium">{consultant.name}</span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {
                  SENIORITY_LABELS[
                    consultant.seniority_level as keyof typeof SENIORITY_LABELS
                  ]
                }
              </span>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {PRACTICE_AREA_LABELS[consultant.practice_area]}
            </span>
          </div>
          {staffingWindow.requiredSkills.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <MatchIndicator
                label="Skill"
                count={skillMatch.length}
                tone="emerald"
                titleWhenActive={`${skillMatch.length} current skill${skillMatch.length === 1 ? '' : 's'} match project requirements`}
                titleWhenInactive="No current skills match project requirements"
              />
              <MatchIndicator
                label="Goal"
                count={goalMatch.length}
                tone="sky"
                titleWhenActive={`${goalMatch.length} developmental goal${goalMatch.length === 1 ? '' : 's'} match project requirements`}
                titleWhenInactive="No developmental goals match project requirements"
              />
            </div>
          )}
          <AvailabilityBar
            consultantId={consultant.id}
            allAssignments={allAssignments}
            windowStart={staffingWindow.startDate}
            windowEnd={staffingWindow.endDate}
          />
        </button>

        <Button
          type="button"
          variant={isExpanded ? 'secondary' : 'ghost'}
          size="xs"
          aria-expanded={isExpanded}
          className="mt-0.5 shrink-0"
          onClick={onToggleExpand}
        >
          {isExpanded ? 'Hide' : 'Expand'}
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200 bg-white/80 px-3 pb-3 pt-3">
          <ExpandedStaffingConsultantDetail
            consultant={consultant}
            staffingWindow={staffingWindow}
            allAssignments={allAssignments}
            allEngagements={allEngagements}
          />
        </div>
      )}
    </div>
  );
}

export function MatchIndicator({
  label,
  count,
  tone,
  titleWhenActive,
  titleWhenInactive,
}: {
  label: string;
  count: number;
  tone: 'emerald' | 'sky';
  titleWhenActive: string;
  titleWhenInactive: string;
}) {
  const active = count > 0;
  const palette =
    tone === 'emerald'
      ? {
          badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
          dot: 'bg-emerald-500',
        }
      : {
          badge: 'border-sky-200 bg-sky-50 text-sky-700',
          dot: 'bg-sky-500',
        };

  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-medium ${
        active ? palette.badge : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
      title={active ? titleWhenActive : titleWhenInactive}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? palette.dot : 'bg-slate-300'
        }`}
      />
      <span>{label}</span>
      {active && <span>{count}</span>}
    </span>
  );
}

export function AvailabilityBar({
  consultantId,
  allAssignments,
  windowStart,
  windowEnd,
}: {
  consultantId: string;
  allAssignments: Assignment[];
  windowStart: string;
  windowEnd: string;
}) {
  const weeks = useMemo(() => {
    return getWeeklyAllocations(
      consultantId,
      allAssignments,
      parseISO(windowStart),
      parseISO(windowEnd)
    );
  }, [consultantId, allAssignments, windowStart, windowEnd]);

  if (weeks.length === 0) {
    return null;
  }

  type Segment = {
    status: 'free' | 'partial' | 'full';
    span: number;
    available: number;
  };

  const segments: Segment[] = [];
  for (const week of weeks) {
    const available = Math.max(0, 100 - week.allocation);
    const status =
      week.allocation >= 100 ? 'full' : week.allocation > 0 ? 'partial' : 'free';
    const last = segments[segments.length - 1];

    if (
      last &&
      last.status === status &&
      (status !== 'partial' || last.available === available)
    ) {
      last.span += 1;
    } else {
      segments.push({ status, span: 1, available });
    }
  }

  return (
    <div className="flex h-[6px] w-full gap-px overflow-hidden rounded-full bg-slate-100">
      {segments.map((segment, index) => {
        const widthPct = (segment.span / weeks.length) * 100;
        const bgClass =
          segment.status === 'full'
            ? 'bg-red-400'
            : segment.status === 'partial'
              ? 'bg-amber-400'
              : 'bg-emerald-400';

        return (
          <div
            key={`${segment.status}-${index}`}
            className={`relative ${bgClass} group`}
            style={{ width: `${widthPct}%` }}
            title={
              segment.status === 'full'
                ? 'Fully booked'
                : segment.status === 'partial'
                  ? `${segment.available}% available`
                  : 'Available'
            }
          >
            {segment.status === 'partial' && widthPct > 15 && (
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold leading-none text-amber-900">
                {segment.available}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getConsultantMatches(source: string[], requiredSkills: string[]) {
  if (source.length === 0 || requiredSkills.length === 0) {
    return [];
  }

  const required = new Set(requiredSkills.map(normalizeSkillName));
  return source.filter((item) => required.has(normalizeSkillName(item)));
}

export function hasNormalizedValue(source: string[], candidate: string) {
  const normalizedCandidate = normalizeSkillName(candidate);
  return source.some((item) => normalizeSkillName(item) === normalizedCandidate);
}

function ExpandedStaffingConsultantDetail({
  consultant,
  staffingWindow,
  allAssignments,
  allEngagements,
}: {
  consultant: Consultant;
  staffingWindow: StaffingWindow;
  allAssignments: Assignment[];
  allEngagements: StaffingProjectSummary[];
}) {
  const timelineWeeks = useMemo(() => {
    return getWeeklyAllocations(
      consultant.id,
      allAssignments,
      parseISO(staffingWindow.startDate),
      parseISO(staffingWindow.endDate)
    );
  }, [
    consultant.id,
    allAssignments,
    staffingWindow.startDate,
    staffingWindow.endDate,
  ]);

  const overlappingAssignments = useMemo(() => {
    return allAssignments
      .filter((assignment) => {
        if (assignment.consultant_id !== consultant.id) {
          return false;
        }
        if (
          staffingWindow.excludeEngagementId &&
          assignment.engagement_id === staffingWindow.excludeEngagementId
        ) {
          return false;
        }
        return datesOverlap(
          assignment.start_date,
          assignment.end_date,
          staffingWindow.startDate,
          staffingWindow.endDate
        );
      })
      .map((assignment) => ({
        assignment,
        relatedEngagement:
          allEngagements.find((engagement) => engagement.id === assignment.engagement_id) ??
          null,
      }))
      .sort((a, b) => a.assignment.start_date.localeCompare(b.assignment.start_date));
  }, [
    allAssignments,
    allEngagements,
    consultant.id,
    staffingWindow.endDate,
    staffingWindow.excludeEngagementId,
    staffingWindow.startDate,
  ]);

  const averageAvailability = Math.round(
    getAverageAvailability(
      consultant.id,
      allAssignments,
      parseISO(staffingWindow.startDate),
      parseISO(staffingWindow.endDate)
    )
  );
  const peakLoad = timelineWeeks.reduce(
    (max, week) => Math.max(max, week.allocation),
    0
  );
  const busyWeeks = timelineWeeks.filter((week) => week.allocation > 0).length;
  const projectRequirements = staffingWindow.requiredSkills.map((skill) => ({
    skill,
    hasSkill: hasNormalizedValue(consultant.skills, skill),
    hasGoal: hasNormalizedValue(consultant.goals, skill),
  }));
  const timelineColumns = `minmax(180px, 240px) repeat(${Math.max(
    timelineWeeks.length,
    1
  )}, minmax(52px, 1fr))`;

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <DetailMetricCard
          label="Other projects"
          value={String(overlappingAssignments.length)}
          detail={
            overlappingAssignments.length === 0
              ? 'Fully open in this window'
              : `${busyWeeks}/${timelineWeeks.length} weeks already staffed`
          }
        />
        <DetailMetricCard
          label="Peak weekly load"
          value={`${peakLoad}%`}
          detail={peakLoad > 100 ? 'Overbooked at peak' : 'Highest committed week'}
        />
        <DetailMetricCard
          label="Average availability"
          value={`${averageAvailability}%`}
          detail={`${format(parseISO(staffingWindow.startDate), 'MMM d')} - ${format(parseISO(staffingWindow.endDate), 'MMM d')}`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Project-Period Timeline
            </p>
            <p className="text-[11px] text-muted-foreground">
              Showing other commitments that overlap {staffingWindow.projectName}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {timelineWeeks.length} week{timelineWeeks.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <div className="min-w-max">
            <div
              className="grid gap-px bg-slate-200"
              style={{ gridTemplateColumns: timelineColumns }}
            >
              <TimelineHeaderCell>Week of</TimelineHeaderCell>
              {timelineWeeks.map((week) => (
                <TimelineHeaderCell key={week.weekStart.toISOString()}>
                  {getWeekLabel(week.weekStart)}
                </TimelineHeaderCell>
              ))}

              <TimelineLabelCell
                title="Total load"
                subtitle={
                  overlappingAssignments.length === 0
                    ? 'Open for the full project window'
                    : 'Combined load across other work'
                }
              />
              {timelineWeeks.map((week) => (
                <TimelineLoadCell
                  key={`total-${week.weekStart.toISOString()}`}
                  allocation={week.allocation}
                />
              ))}

              {overlappingAssignments.map(({ assignment, relatedEngagement }) => (
                <TimelineAssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  relatedEngagement={relatedEngagement}
                  timelineWeeks={timelineWeeks}
                />
              ))}
            </div>
          </div>
        </div>

        {overlappingAssignments.length === 0 && (
          <p className="text-[11px] text-emerald-700">
            No other projects overlap this period, so this consultant is fully open
            throughout the project window.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Project Fit
          </p>
          <MatchLegend label="Skill match" tone="emerald" />
          <MatchLegend label="Goal match" tone="sky" />
          <MatchLegend label="Gap" tone="slate" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {projectRequirements.length > 0 ? (
            projectRequirements.map(({ skill, hasSkill, hasGoal }) => (
              <ProjectRequirementPill
                key={skill}
                skill={skill}
                hasSkill={hasSkill}
                hasGoal={hasGoal}
              />
            ))
          ) : (
            <span className="text-[11px] text-muted-foreground">
              No required skills are defined for this project yet.
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ConsultantFocusList
          title="Current Skills"
          items={consultant.skills}
          requiredSkills={staffingWindow.requiredSkills}
          tone="emerald"
          emptyMessage="No current skills listed"
        />
        <ConsultantFocusList
          title="Development Goals"
          items={consultant.goals}
          requiredSkills={staffingWindow.requiredSkills}
          tone="sky"
          emptyMessage="No developmental goals listed"
        />
      </div>
    </div>
  );
}

function DetailMetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function TimelineAssignmentRow({
  assignment,
  relatedEngagement,
  timelineWeeks,
}: {
  assignment: Assignment;
  relatedEngagement: StaffingProjectSummary | null;
  timelineWeeks: ReturnType<typeof getWeeklyAllocations>;
}) {
  return (
    <>
      <TimelineLabelCell
        title={relatedEngagement?.client_name ?? 'Unknown project'}
        subtitle={`${relatedEngagement?.project_name ?? 'Project details unavailable'} • ${assignment.role} • ${assignment.allocation_percentage}%`}
        color={relatedEngagement?.color}
      />
      {timelineWeeks.map((week) => (
        <TimelineAssignmentCell
          key={`${assignment.id}-${week.weekStart.toISOString()}`}
          active={isWeekAllocated(week.weekStart, assignment)}
          allocation={assignment.allocation_percentage}
          color={relatedEngagement?.color ?? '#94A3B8'}
        />
      ))}
    </>
  );
}

function TimelineHeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function TimelineLabelCell({
  title,
  subtitle,
  color,
}: {
  title: string;
  subtitle: string;
  color?: string;
}) {
  return (
    <div className="bg-white px-3 py-2.5">
      <div className="flex items-start gap-2">
        {color && (
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900">{title}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineLoadCell({ allocation }: { allocation: number }) {
  return (
    <div className="bg-white p-1.5">
      <div
        className={cn(
          'flex min-h-10 items-center justify-center rounded-md border text-[10px] font-semibold',
          allocation === 0
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : allocation >= 100
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
        )}
      >
        {allocation === 0 ? 'Open' : `${allocation}%`}
      </div>
    </div>
  );
}

function TimelineAssignmentCell({
  active,
  allocation,
  color,
}: {
  active: boolean;
  allocation: number;
  color: string;
}) {
  return (
    <div className="bg-white p-1.5">
      <div
        className={cn(
          'flex min-h-10 items-center justify-center rounded-md border text-[10px] font-medium',
          active
            ? 'text-slate-700'
            : 'border-dashed border-slate-200 bg-slate-50 text-slate-300'
        )}
        style={
          active
            ? {
                backgroundColor: withAlpha(color, 0.14),
                borderColor: withAlpha(color, 0.32),
              }
            : undefined
        }
      >
        {active ? `${allocation}%` : '—'}
      </div>
    </div>
  );
}

function MatchLegend({
  label,
  tone,
}: {
  label: string;
  tone: 'emerald' | 'sky' | 'slate';
}) {
  const dotClass =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'sky'
        ? 'bg-sky-500'
        : 'bg-slate-300';

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={cn('h-2 w-2 rounded-full', dotClass)} />
      {label}
    </span>
  );
}

function ProjectRequirementPill({
  skill,
  hasSkill,
  hasGoal,
}: {
  skill: string;
  hasSkill: boolean;
  hasGoal: boolean;
}) {
  const stateClass = hasSkill
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : hasGoal
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : 'border-slate-200 bg-slate-50 text-slate-500';

  const label = hasSkill ? 'Current skill' : hasGoal ? 'Development goal' : 'Gap';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium',
        stateClass
      )}
    >
      <span>{skill}</span>
      <span className="text-[10px] opacity-80">{label}</span>
    </span>
  );
}

function ConsultantFocusList({
  title,
  items,
  requiredSkills,
  tone,
  emptyMessage,
}: {
  title: string;
  items: string[];
  requiredSkills: string[];
  tone: 'emerald' | 'sky';
  emptyMessage: string;
}) {
  const matches = getConsultantMatches(items, requiredSkills);

  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground">
            {matches.length} match{matches.length === 1 ? '' : 'es'} for this
            project
          </p>
        </div>
        <MatchIndicator
          label={tone === 'emerald' ? 'Skill' : 'Goal'}
          count={matches.length}
          tone={tone}
          titleWhenActive={`${matches.length} ${title.toLowerCase()} match project requirements`}
          titleWhenInactive={`No ${title.toLowerCase()} match project requirements`}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium',
                hasNormalizedValue(requiredSkills, item)
                  ? tone === 'emerald'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              )}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-muted-foreground">{emptyMessage}</span>
        )}
      </div>
    </div>
  );
}

function normalizeSkillName(value: string) {
  return value.trim().toLowerCase();
}

function isWeekAllocated(weekStart: Date, assignment: Assignment) {
  return isWithinRange(
    weekStart,
    parseISO(assignment.start_date),
    parseISO(assignment.end_date)
  );
}

function withAlpha(hexColor: string, alpha: number) {
  const safeHex = hexColor.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(safeHex)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }

  const r = Number.parseInt(safeHex.slice(0, 2), 16);
  const g = Number.parseInt(safeHex.slice(2, 4), 16);
  const b = Number.parseInt(safeHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
