'use client';

import { useMemo } from 'react';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  getCurrentConsultantUtilization,
  allocationPercentageToManDays,
} from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusColor } from '@/lib/utils/colors';
import {
  PRACTICE_AREA_LABELS,
  SENIORITY_LABELS,
  type PracticeArea,
} from '@/lib/types/consultant';
import {
  ENGAGEMENT_STATUS_BADGE_CLASSES,
  ENGAGEMENT_STATUS_LABELS,
} from '@/lib/types/engagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  format,
  subWeeks,
  startOfWeek,
  parseISO,
} from 'date-fns';

// ─── Types ───────────────────────────────────────────────────

interface TrendPoint {
  week: string;
  label: string;
  avg_utilization: number;
  active_engagements: number;
  bench_count: number;
  at_risk_count: number;
}

interface PracticeAreaMetric {
  area: PracticeArea;
  label: string;
  consultant_count: number;
  avg_utilization: number;
  at_risk_count: number;
}

interface EngagementMetric {
  id: string;
  client_name: string;
  project_name: string;
  status: string;
  start_date: string;
  end_date: string;
  team_size: number;
  total_allocation: number;
  man_days: number;
  color: string;
}

interface AtRiskPerson {
  id: string;
  name: string;
  practice_area: string;
  seniority_level: string;
  utilization: number;
  burnout_score: number;
  active_engagements: number;
  signal_count: number;
}

interface ExecutiveData {
  current: {
    total_consultants: number;
    avg_utilization: number;
    active_engagements: number;
    upcoming_engagements: number;
    bench_count: number;
    at_risk_count: number;
    avg_burnout: number;
    total_man_days: number;
  };
  trends: TrendPoint[];
  practice_areas: PracticeAreaMetric[];
  engagements: EngagementMetric[];
  at_risk: AtRiskPerson[];
  deltas: {
    utilization: number;
    engagements: number;
    bench: number;
    risk: number;
  };
}

// ─── Data Computation ────────────────────────────────────────

function useExecutiveData(): ExecutiveData | null {
  const consultants = useConsultantStore((s) => s.consultants);
  const engagements = useEngagementStore((s) => s.engagements);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  return useMemo(() => {
    if (consultants.length === 0) return null;

    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Per-consultant current metrics
    const consultantMetrics = consultants.map((c) => {
      const utilization = getCurrentConsultantUtilization(c.id, assignments);
      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      const activeCount = assignments.filter(
        (a) =>
          a.consultant_id === c.id &&
          parseISO(a.start_date) <= now &&
          parseISO(a.end_date) >= now,
      ).length;
      return {
        id: c.id,
        utilization,
        burnout,
        activeCount,
        practice_area: c.practice_area,
        seniority_level: c.seniority_level,
        name: c.name,
      };
    });

    // Current KPIs
    const avgUtilization = Math.round(
      consultantMetrics.reduce((s, c) => s + c.utilization, 0) /
        consultantMetrics.length,
    );
    const benchCount = consultantMetrics.filter(
      (c) => c.utilization < 50,
    ).length;
    const atRiskCount = consultantMetrics.filter(
      (c) => c.burnout >= 70,
    ).length;
    const avgBurnout = Math.round(
      consultantMetrics.reduce((s, c) => s + c.burnout, 0) /
        consultantMetrics.length,
    );
    const activeEngs = engagements.filter(
      (e) => parseISO(e.start_date) <= now && parseISO(e.end_date) >= now,
    );
    const upcomingEngs = engagements.filter(
      (e) => parseISO(e.start_date) > now,
    );
    const totalManDays =
      Math.round(
        allocationPercentageToManDays(
          consultantMetrics.reduce((s, c) => s + c.utilization, 0),
        ) * 10,
      ) / 10;

    // 12-week trends
    const trends: TrendPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = subWeeks(currentWeekStart, i);
      let weekTotalUtil = 0;
      let weekBenchCount = 0;
      let weekAtRisk = 0;

      for (const c of consultants) {
        const util = getCurrentConsultantUtilization(
          c.id,
          assignments,
          weekStart,
        );
        weekTotalUtil += util;
        if (util < 50) weekBenchCount++;
        const burnout = calculateBurnoutRisk(c.id, assignments, signals);
        if (burnout >= 70) weekAtRisk++;
      }

      const weekActiveEngs = engagements.filter((e) => {
        const start = parseISO(e.start_date);
        const end = parseISO(e.end_date);
        return start <= weekStart && end >= weekStart;
      }).length;

      trends.push({
        week: format(weekStart, 'yyyy-MM-dd'),
        label: format(weekStart, 'MMM d'),
        avg_utilization:
          consultants.length > 0
            ? Math.round(weekTotalUtil / consultants.length)
            : 0,
        active_engagements: weekActiveEngs,
        bench_count: weekBenchCount,
        at_risk_count: weekAtRisk,
      });
    }

    // Deltas (current vs 4 weeks ago)
    const fourWeeksAgo = trends.length >= 5 ? trends[trends.length - 5] : trends[0];
    const currentTrend = trends[trends.length - 1];
    const deltas = {
      utilization: currentTrend.avg_utilization - fourWeeksAgo.avg_utilization,
      engagements:
        currentTrend.active_engagements - fourWeeksAgo.active_engagements,
      bench: currentTrend.bench_count - fourWeeksAgo.bench_count,
      risk: currentTrend.at_risk_count - fourWeeksAgo.at_risk_count,
    };

    // Practice area breakdown
    const practiceAreas: PracticeAreaMetric[] = (
      ['strategy', 'operations', 'digital', 'risk', 'people'] as PracticeArea[]
    ).map((area) => {
      const areaMetrics = consultantMetrics.filter(
        (m) => m.practice_area === area,
      );
      const areaAvgUtil =
        areaMetrics.length > 0
          ? Math.round(
              areaMetrics.reduce((s, m) => s + m.utilization, 0) /
                areaMetrics.length,
            )
          : 0;
      return {
        area,
        label: PRACTICE_AREA_LABELS[area],
        consultant_count: areaMetrics.length,
        avg_utilization: areaAvgUtil,
        at_risk_count: areaMetrics.filter((m) => m.burnout >= 70).length,
      };
    });

    // Engagement portfolio
    const engagementPortfolio: EngagementMetric[] = engagements
      .sort((a, b) => {
        const order: Record<string, number> = {
          active: 0,
          upcoming: 1,
          completed: 2,
        };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      })
      .map((e) => {
        const engAssignments = assignments.filter(
          (a) => a.engagement_id === e.id,
        );
        const teamSize = new Set(
          engAssignments.map((a) => a.consultant_id),
        ).size;
        const totalAllocation = engAssignments.reduce(
          (s, a) => s + a.allocation_percentage,
          0,
        );
        return {
          id: e.id,
          client_name: e.client_name,
          project_name: e.project_name,
          status: e.status,
          start_date: e.start_date,
          end_date: e.end_date,
          team_size: teamSize,
          total_allocation: totalAllocation,
          man_days:
            Math.round(allocationPercentageToManDays(totalAllocation) * 10) /
            10,
          color: e.color,
        };
      });

    // At-risk consultants
    const atRisk: AtRiskPerson[] = consultantMetrics
      .filter((m) => m.burnout >= 40)
      .sort((a, b) => b.burnout - a.burnout)
      .map((m) => ({
        id: m.id,
        name: m.name,
        practice_area: m.practice_area,
        seniority_level: m.seniority_level,
        utilization: m.utilization,
        burnout_score: m.burnout,
        active_engagements: m.activeCount,
        signal_count: signals.filter((s) => s.consultant_id === m.id).length,
      }));

    return {
      current: {
        total_consultants: consultants.length,
        avg_utilization: avgUtilization,
        active_engagements: activeEngs.length,
        upcoming_engagements: upcomingEngs.length,
        bench_count: benchCount,
        at_risk_count: atRiskCount,
        avg_burnout: avgBurnout,
        total_man_days: totalManDays,
      },
      trends,
      practice_areas: practiceAreas,
      engagements: engagementPortfolio,
      at_risk: atRisk,
      deltas,
    };
  }, [consultants, engagements, assignments, signals]);
}

// ─── KPI Card ────────────────────────────────────────────────

function KPICard({
  label,
  value,
  suffix,
  delta,
  invertDelta,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  delta?: number;
  invertDelta?: boolean;
}) {
  const isNeutral = delta === 0 || delta === undefined;
  // "good" determines color (green vs red). Arrow always reflects actual direction.
  const isGood = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0;
  const wentUp = (delta ?? 0) > 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {label}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            {value}
          </span>
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
        {!isNeutral && delta !== undefined && (
          <div
            className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${
              isGood
                ? 'text-emerald-600'
                : 'text-red-500'
            }`}
          >
            <span>{wentUp ? '\u2191' : '\u2193'}</span>
            <span>
              {Math.abs(delta)} vs 4w ago
            </span>
          </div>
        )}
        {isNeutral && delta !== undefined && (
          <div className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
            <span>{'\u2192'}</span>
            <span>No change vs 4w ago</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Utilization Trend Chart ─────────────────────────────────

function UtilizationTrend({ trends }: { trends: TrendPoint[] }) {
  const width = 640;
  const height = 220;
  const pad = { top: 24, right: 16, bottom: 32, left: 44 };

  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxY = 120;

  const x = (i: number) =>
    pad.left + (i / Math.max(trends.length - 1, 1)) * chartW;
  const y = (v: number) => pad.top + chartH - (v / maxY) * chartH;

  const linePath = trends
    .map((t, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(t.avg_utilization)}`)
    .join(' ');

  const areaPath = `${linePath} L ${x(trends.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  // Engagement count as secondary bars
  const maxEngs = Math.max(...trends.map((t) => t.active_engagements), 1);
  const barWidth = chartW / trends.length * 0.5;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Utilization Rate &amp; Active Engagements
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-foreground/70 rounded-full inline-block" />
              Avg Utilization
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-foreground/10 inline-block" />
              Engagements
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          role="img"
          aria-label="12-week utilization trend chart"
        >
          <defs>
            <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 40, 80, 120].map((v) => (
            <line
              key={v}
              x1={pad.left}
              y1={y(v)}
              x2={width - pad.right}
              y2={y(v)}
              stroke="currentColor"
              strokeOpacity="0.06"
              className="text-foreground"
            />
          ))}

          {/* 80% target line */}
          <line
            x1={pad.left}
            y1={y(80)}
            x2={width - pad.right}
            y2={y(80)}
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeDasharray="4,4"
            className="text-foreground"
          />
          <text
            x={width - pad.right + 2}
            y={y(80) + 3}
            className="fill-muted-foreground"
            fontSize="8"
            textAnchor="start"
          >
            80%
          </text>

          {/* Engagement bars (background) */}
          {trends.map((t, i) => (
            <rect
              key={`bar-${i}`}
              x={x(i) - barWidth / 2}
              y={y(0) - (t.active_engagements / maxEngs) * chartH * 0.3}
              width={barWidth}
              height={(t.active_engagements / maxEngs) * chartH * 0.3}
              rx="2"
              fill="currentColor"
              fillOpacity="0.06"
              className="text-foreground"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#utilGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/70"
          />

          {/* Data points */}
          {trends.map((t, i) => (
            <g key={`dot-${i}`}>
              <circle
                cx={x(i)}
                cy={y(t.avg_utilization)}
                r="3"
                fill="hsl(var(--background))"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-foreground/70"
              />
              {/* Value label on hover-equivalent (first, last, and every 3rd) */}
              {(i === 0 || i === trends.length - 1 || i % 3 === 0) && (
                <text
                  x={x(i)}
                  y={y(t.avg_utilization) - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  className="fill-foreground/60"
                >
                  {t.avg_utilization}%
                </text>
              )}
            </g>
          ))}

          {/* Y-axis labels */}
          {[0, 40, 80, 120].map((v) => (
            <text
              key={`y-${v}`}
              x={pad.left - 8}
              y={y(v) + 3}
              textAnchor="end"
              fontSize="9"
              className="fill-muted-foreground"
            >
              {v}%
            </text>
          ))}

          {/* X-axis labels */}
          {trends.map((t, i) =>
            i % 2 === 0 ? (
              <text
                key={`x-${i}`}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                {t.label}
              </text>
            ) : null,
          )}
        </svg>
      </CardContent>
    </Card>
  );
}

// ─── Practice Area Breakdown ─────────────────────────────────

function PracticeBreakdown({
  practiceAreas,
}: {
  practiceAreas: PracticeAreaMetric[];
}) {
  const maxUtil = Math.max(...practiceAreas.map((p) => p.avg_utilization), 100);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Utilization by Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {practiceAreas.map((pa) => {
          const barColor =
            pa.avg_utilization >= 90
              ? 'bg-red-500/80'
              : pa.avg_utilization >= 70
                ? 'bg-emerald-500/80'
                : pa.avg_utilization >= 40
                  ? 'bg-amber-500/80'
                  : 'bg-slate-400/60';

          return (
            <div key={pa.area}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{pa.label}</span>
                <div className="flex items-center gap-2">
                  {pa.at_risk_count > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700"
                    >
                      {pa.at_risk_count} at risk
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {pa.consultant_count} people
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{
                      width: `${(pa.avg_utilization / maxUtil) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums w-10 text-right">
                  {pa.avg_utilization}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Engagement Portfolio ────────────────────────────────────

function EngagementPortfolio({
  engagements,
}: {
  engagements: EngagementMetric[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Engagement Portfolio
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {engagements.length} total
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="px-4">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_64px_64px_100px] gap-2 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b">
              <span>Engagement</span>
              <span className="text-center">Status</span>
              <span className="text-right">Team</span>
              <span className="text-right">d/wk</span>
              <span className="text-right">Timeline</span>
            </div>

            {/* Rows */}
            {engagements.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[1fr_80px_64px_64px_100px] gap-2 py-2.5 items-center border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: e.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {e.client_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {e.project_name}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <Badge
                    variant="secondary"
                    className={`text-[9px] px-1.5 py-0 ${ENGAGEMENT_STATUS_BADGE_CLASSES[e.status as keyof typeof ENGAGEMENT_STATUS_BADGE_CLASSES] || ''}`}
                  >
                    {ENGAGEMENT_STATUS_LABELS[e.status as keyof typeof ENGAGEMENT_STATUS_LABELS] || e.status}
                  </Badge>
                </div>
                <span className="text-xs tabular-nums text-right">
                  {e.team_size}
                </span>
                <span className="text-xs tabular-nums text-right">
                  {e.man_days}
                </span>
                <span className="text-[10px] text-muted-foreground text-right tabular-nums">
                  {format(parseISO(e.start_date), 'MMM d')} &ndash;{' '}
                  {format(parseISO(e.end_date), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── At-Risk Table ───────────────────────────────────────────

function RiskOverview({ atRisk }: { atRisk: AtRiskPerson[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            People Requiring Attention
          </CardTitle>
          {atRisk.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[9px] bg-red-100 text-red-700"
            >
              {atRisk.filter((p) => p.burnout_score >= 70).length} critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="px-4">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_60px_60px_48px] gap-2 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b">
              <span>Consultant</span>
              <span>Practice</span>
              <span className="text-right">Util</span>
              <span className="text-right">Burnout</span>
              <span className="text-right">Flags</span>
            </div>

            {atRisk.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No consultants flagged
              </div>
            )}

            {/* Rows */}
            {atRisk.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_80px_60px_60px_48px] gap-2 py-2.5 items-center border-b border-border/50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {SENIORITY_LABELS[p.seniority_level as keyof typeof SENIORITY_LABELS] || p.seniority_level}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {PRACTICE_AREA_LABELS[p.practice_area as keyof typeof PRACTICE_AREA_LABELS] || p.practice_area}
                </span>
                <span className="text-xs tabular-nums text-right font-medium">
                  {p.utilization}%
                </span>
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getStatusColor(p.burnout_score) }}
                  />
                  <span className="text-xs tabular-nums font-semibold">
                    {p.burnout_score}
                  </span>
                </div>
                <span className="text-xs tabular-nums text-right text-muted-foreground">
                  {p.signal_count > 0 ? p.signal_count : '\u2014'}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────

function ExecutiveSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────

export function ExecutiveDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const data = useExecutiveData();

  if (!currentUser || currentUser.role !== 'partner') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Partner Access Required</p>
          <p className="text-xs text-muted-foreground">
            The executive summary is available to partners only.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <ExecutiveSkeleton />;
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50/50">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Executive Summary
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            12-week rolling view &middot; {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          Live from database
        </Badge>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            label="Headcount"
            value={data.current.total_consultants}
            suffix="active"
          />
          <KPICard
            label="Avg Utilization"
            value={`${data.current.avg_utilization}%`}
            delta={data.deltas.utilization}
          />
          <KPICard
            label="Active Projects"
            value={data.current.active_engagements}
            delta={data.deltas.engagements}
          />
          <KPICard
            label="On Bench"
            value={data.current.bench_count}
            delta={data.deltas.bench}
            invertDelta
          />
          <KPICard
            label="At Risk"
            value={data.current.at_risk_count}
            delta={data.deltas.risk}
            invertDelta
          />
          <KPICard
            label="Deployed"
            value={data.current.total_man_days}
            suffix="d/wk"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <UtilizationTrend trends={data.trends} />
          </div>
          <PracticeBreakdown practiceAreas={data.practice_areas} />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EngagementPortfolio engagements={data.engagements} />
          <RiskOverview atRisk={data.at_risk} />
        </div>

        {/* Pipeline Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs">
                    <span className="font-semibold">{data.current.active_engagements}</span>{' '}
                    <span className="text-muted-foreground">active</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs">
                    <span className="font-semibold">{data.current.upcoming_engagements}</span>{' '}
                    <span className="text-muted-foreground">upcoming</span>
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs text-muted-foreground">
                  {data.engagements.filter((e) => e.status === 'completed').length}{' '}
                  completed this quarter
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Total capacity deployed:{' '}
                <span className="font-semibold text-foreground">
                  {data.current.total_man_days} man-days/week
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
