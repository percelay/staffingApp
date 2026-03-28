import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api/rbac';
import {
  toConsultantDTO,
  toEngagementDTO,
  toAssignmentDTO,
  toWellbeingDTO,
} from '@/lib/api/transformers';
import { getCurrentConsultantUtilization, allocationPercentageToManDays } from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusLabel } from '@/lib/utils/colors';
import { PRACTICE_AREA_LABELS, type PracticeArea } from '@/lib/types/consultant';
import {
  startOfWeek,
  subWeeks,
  format,
  parseISO,
} from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/executive-summary
 * Partner-only endpoint. Returns aggregated executive metrics computed
 * from the database: current KPIs, 12-week trends, practice area breakdown,
 * engagement portfolio, and at-risk consultants.
 */
export const GET = withAuth('executive_summary', async () => {
  // ─── Fetch all data from DB ────────────────────────────────
  const [dbConsultants, dbEngagements, dbAssignments, dbSignals] =
    await Promise.all([
      prisma.consultant.findMany({
        where: { status: 'active' },
        include: {
          skills: { include: { skill: true } },
          goals: { include: { skill: true } },
        },
      }),
      prisma.engagement.findMany({
        include: { requiredSkills: { include: { skill: true } } },
      }),
      prisma.assignment.findMany(),
      prisma.wellbeingSignal.findMany(),
    ]);

  // ─── Transform to frontend DTOs (reuse existing utilities) ─
  const consultants = dbConsultants.map(toConsultantDTO);
  const engagements = dbEngagements.map(toEngagementDTO);
  const assignments = dbAssignments.map(toAssignmentDTO);
  const signals = dbSignals.map(toWellbeingDTO);

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  // ─── Current KPIs ──────────────────────────────────────────
  const consultantMetrics = consultants.map((c) => {
    const utilization = getCurrentConsultantUtilization(c.id, assignments);
    const burnout = calculateBurnoutRisk(c.id, assignments, signals);
    const activeCount = assignments.filter(
      (a) =>
        a.consultant_id === c.id &&
        parseISO(a.start_date) <= now &&
        parseISO(a.end_date) >= now,
    ).length;
    return { id: c.id, utilization, burnout, activeCount };
  });

  const avgUtilization =
    consultantMetrics.length > 0
      ? Math.round(
          consultantMetrics.reduce((s, c) => s + c.utilization, 0) /
            consultantMetrics.length,
        )
      : 0;

  const benchCount = consultantMetrics.filter((c) => c.utilization < 50).length;
  const atRiskCount = consultantMetrics.filter((c) => c.burnout >= 70).length;
  const avgBurnout =
    consultantMetrics.length > 0
      ? Math.round(
          consultantMetrics.reduce((s, c) => s + c.burnout, 0) /
            consultantMetrics.length,
        )
      : 0;

  const activeEngagements = engagements.filter(
    (e) => parseISO(e.start_date) <= now && parseISO(e.end_date) >= now,
  );
  const upcomingEngagements = engagements.filter(
    (e) => parseISO(e.start_date) > now,
  );

  const totalManDays = allocationPercentageToManDays(
    consultantMetrics.reduce((s, c) => s + c.utilization, 0),
  );

  // ─── 12-week trends ───────────────────────────────────────
  const trends = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = subWeeks(currentWeekStart, i);

    let weekTotalUtil = 0;
    let weekBenchCount = 0;
    let weekAtRisk = 0;

    for (const c of consultants) {
      const util = getCurrentConsultantUtilization(c.id, assignments, weekStart);
      weekTotalUtil += util;
      if (util < 50) weekBenchCount++;
      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      if (burnout >= 70) weekAtRisk++;
    }

    const weekActiveEngagements = engagements.filter((e) => {
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
      active_engagements: weekActiveEngagements,
      bench_count: weekBenchCount,
      at_risk_count: weekAtRisk,
    });
  }

  // ─── Practice area breakdown ───────────────────────────────
  const practiceAreas = (
    ['strategy', 'operations', 'digital', 'risk', 'people'] as PracticeArea[]
  ).map((area) => {
    const areaConsultants = consultants.filter(
      (c) => c.practice_area === area,
    );
    const areaMetrics = consultantMetrics.filter((m) =>
      areaConsultants.some((c) => c.id === m.id),
    );

    const areaAvgUtil =
      areaMetrics.length > 0
        ? Math.round(
            areaMetrics.reduce((s, m) => s + m.utilization, 0) /
              areaMetrics.length,
          )
        : 0;

    const areaAtRisk = areaMetrics.filter((m) => m.burnout >= 70).length;

    return {
      area,
      label: PRACTICE_AREA_LABELS[area],
      consultant_count: areaConsultants.length,
      avg_utilization: areaAvgUtil,
      at_risk_count: areaAtRisk,
    };
  });

  // ─── Engagement portfolio ──────────────────────────────────
  const engagementPortfolio = engagements
    .sort((a, b) => {
      const order = { active: 0, upcoming: 1, completed: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    })
    .map((e) => {
      const engAssignments = assignments.filter(
        (a) => a.engagement_id === e.id,
      );
      const teamSize = new Set(engAssignments.map((a) => a.consultant_id)).size;
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
        man_days: allocationPercentageToManDays(totalAllocation),
        color: e.color,
      };
    });

  // ─── At-risk consultants ───────────────────────────────────
  const atRisk = consultantMetrics
    .filter((m) => m.burnout >= 40)
    .sort((a, b) => b.burnout - a.burnout)
    .map((m) => {
      const c = consultants.find((c) => c.id === m.id)!;
      const mySignals = signals.filter((s) => s.consultant_id === c.id);
      return {
        id: c.id,
        name: c.name,
        practice_area: c.practice_area,
        seniority_level: c.seniority_level,
        utilization: m.utilization,
        burnout_score: m.burnout,
        status: getStatusLabel(m.burnout),
        active_engagements: m.activeCount,
        signal_count: mySignals.length,
        signals: mySignals.map((s) => ({
          type: s.signal_type,
          severity: s.severity,
        })),
      };
    });

  return Response.json({
    current: {
      total_consultants: consultants.length,
      avg_utilization: avgUtilization,
      active_engagements: activeEngagements.length,
      upcoming_engagements: upcomingEngagements.length,
      bench_count: benchCount,
      at_risk_count: atRiskCount,
      avg_burnout: avgBurnout,
      total_man_days: Math.round(totalManDays * 10) / 10,
    },
    trends,
    practice_areas: practiceAreas,
    engagements: engagementPortfolio,
    at_risk: atRisk,
  });
});
