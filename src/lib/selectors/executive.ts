import {
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';
import type { Assignment } from '@/lib/types/assignment';
import {
  PRACTICE_AREA_LABELS,
  PRACTICE_AREA_VALUES,
  type Consultant,
  type PracticeArea,
} from '@/lib/types/consultant';
import type { Engagement } from '@/lib/types/engagement';
import type { WellbeingSignal } from '@/lib/types/wellbeing';
import {
  allocationPercentageToManDays,
  getCurrentConsultantUtilization,
} from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusLabel } from '@/lib/utils/colors';

export interface ExecutiveTrendPoint {
  week: string;
  label: string;
  avg_utilization: number;
  active_engagements: number;
  bench_count: number;
  at_risk_count: number;
}

export interface ExecutivePracticeAreaMetric {
  area: PracticeArea;
  label: string;
  consultant_count: number;
  avg_utilization: number;
  at_risk_count: number;
}

export interface ExecutiveEngagementMetric {
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

export interface ExecutiveRiskSignal {
  type: WellbeingSignal['signal_type'];
  severity: WellbeingSignal['severity'];
}

export interface ExecutiveAtRiskPerson {
  id: string;
  name: string;
  practice_area: PracticeArea;
  seniority_level: Consultant['seniority_level'];
  utilization: number;
  burnout_score: number;
  status: ReturnType<typeof getStatusLabel>;
  active_engagements: number;
  signal_count: number;
  signals: ExecutiveRiskSignal[];
}

export interface ExecutiveSummary {
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
  trends: ExecutiveTrendPoint[];
  practice_areas: ExecutivePracticeAreaMetric[];
  engagements: ExecutiveEngagementMetric[];
  at_risk: ExecutiveAtRiskPerson[];
  deltas: {
    utilization: number;
    engagements: number;
    bench: number;
    risk: number;
  };
}

interface ExecutiveSummaryInput {
  consultants: Consultant[];
  engagements: Engagement[];
  assignments: Assignment[];
  signals: WellbeingSignal[];
  now?: Date;
}

export function buildExecutiveSummary({
  consultants,
  engagements,
  assignments,
  signals,
  now = new Date(),
}: ExecutiveSummaryInput): ExecutiveSummary {
  const activeConsultants = consultants.filter(
    (consultant) => consultant.status === 'active'
  );
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  const consultantMetrics = activeConsultants.map((consultant) => {
    const utilization = getCurrentConsultantUtilization(
      consultant.id,
      assignments,
      now
    );
    const burnout = calculateBurnoutRisk(consultant.id, assignments, signals);
    const activeCount = assignments.filter(
      (assignment) =>
        assignment.consultant_id === consultant.id &&
        parseISO(assignment.start_date) <= now &&
        parseISO(assignment.end_date) >= now
    ).length;

    return {
      ...consultant,
      utilization,
      burnout,
      activeCount,
    };
  });

  const avgUtilization =
    consultantMetrics.length > 0
      ? Math.round(
          consultantMetrics.reduce(
            (sum, consultant) => sum + consultant.utilization,
            0
          ) / consultantMetrics.length
        )
      : 0;

  const benchCount = consultantMetrics.filter(
    (consultant) => consultant.utilization < 50
  ).length;
  const atRiskCount = consultantMetrics.filter(
    (consultant) => consultant.burnout >= 70
  ).length;
  const avgBurnout =
    consultantMetrics.length > 0
      ? Math.round(
          consultantMetrics.reduce(
            (sum, consultant) => sum + consultant.burnout,
            0
          ) / consultantMetrics.length
        )
      : 0;

  const activeEngagements = engagements.filter(
    (engagement) =>
      parseISO(engagement.start_date) <= now &&
      parseISO(engagement.end_date) >= now
  );
  const upcomingEngagements = engagements.filter(
    (engagement) => parseISO(engagement.start_date) > now
  );

  const totalManDays =
    Math.round(
      allocationPercentageToManDays(
        consultantMetrics.reduce(
          (sum, consultant) => sum + consultant.utilization,
          0
        )
      ) * 10
    ) / 10;

  const trends: ExecutiveTrendPoint[] = [];
  for (let index = 11; index >= 0; index -= 1) {
    const weekStart = subWeeks(currentWeekStart, index);

    let weekTotalUtilization = 0;
    let weekBenchCount = 0;
    let weekAtRiskCount = 0;

    for (const consultant of activeConsultants) {
      const utilization = getCurrentConsultantUtilization(
        consultant.id,
        assignments,
        weekStart
      );

      weekTotalUtilization += utilization;
      if (utilization < 50) {
        weekBenchCount += 1;
      }

      const burnout = calculateBurnoutRisk(consultant.id, assignments, signals);
      if (burnout >= 70) {
        weekAtRiskCount += 1;
      }
    }

    const weekActiveEngagements = engagements.filter((engagement) => {
      const start = parseISO(engagement.start_date);
      const end = parseISO(engagement.end_date);
      return start <= weekStart && end >= weekStart;
    }).length;

    trends.push({
      week: format(weekStart, 'yyyy-MM-dd'),
      label: format(weekStart, 'MMM d'),
      avg_utilization:
        activeConsultants.length > 0
          ? Math.round(weekTotalUtilization / activeConsultants.length)
          : 0,
      active_engagements: weekActiveEngagements,
      bench_count: weekBenchCount,
      at_risk_count: weekAtRiskCount,
    });
  }

  const currentTrend = trends[trends.length - 1];
  const fourWeeksAgoTrend = trends.length >= 5 ? trends[trends.length - 5] : currentTrend;

  const practiceAreas: ExecutivePracticeAreaMetric[] = PRACTICE_AREA_VALUES.map(
    (practiceArea) => {
      const areaMetrics = consultantMetrics.filter(
        (consultant) => consultant.practice_area === practiceArea
      );

      return {
        area: practiceArea,
        label: PRACTICE_AREA_LABELS[practiceArea],
        consultant_count: areaMetrics.length,
        avg_utilization:
          areaMetrics.length > 0
            ? Math.round(
                areaMetrics.reduce(
                  (sum, consultant) => sum + consultant.utilization,
                  0
                ) / areaMetrics.length
              )
            : 0,
        at_risk_count: areaMetrics.filter(
          (consultant) => consultant.burnout >= 70
        ).length,
      };
    }
  );

  const engagementOrder: Record<string, number> = {
    active: 0,
    at_risk: 1,
    upcoming: 2,
    completed: 3,
  };

  const engagementPortfolio: ExecutiveEngagementMetric[] = [...engagements]
    .sort(
      (left, right) =>
        (engagementOrder[left.status] ?? 9) -
        (engagementOrder[right.status] ?? 9)
    )
    .map((engagement) => {
      const engagementAssignments = assignments.filter(
        (assignment) => assignment.engagement_id === engagement.id
      );
      const totalAllocation = engagementAssignments.reduce(
        (sum, assignment) => sum + assignment.allocation_percentage,
        0
      );

      return {
        id: engagement.id,
        client_name: engagement.client_name,
        project_name: engagement.project_name,
        status: engagement.status,
        start_date: engagement.start_date,
        end_date: engagement.end_date,
        team_size: new Set(
          engagementAssignments.map((assignment) => assignment.consultant_id)
        ).size,
        total_allocation: totalAllocation,
        man_days:
          Math.round(allocationPercentageToManDays(totalAllocation) * 10) / 10,
        color: engagement.color,
      };
    });

  const atRisk: ExecutiveAtRiskPerson[] = consultantMetrics
    .filter((consultant) => consultant.burnout >= 40)
    .sort((left, right) => right.burnout - left.burnout)
    .map((consultant) => {
      const consultantSignals = signals.filter(
        (signal) => signal.consultant_id === consultant.id
      );

      return {
        id: consultant.id,
        name: consultant.name,
        practice_area: consultant.practice_area,
        seniority_level: consultant.seniority_level,
        utilization: consultant.utilization,
        burnout_score: consultant.burnout,
        status: getStatusLabel(consultant.burnout),
        active_engagements: consultant.activeCount,
        signal_count: consultantSignals.length,
        signals: consultantSignals.map((signal) => ({
          type: signal.signal_type,
          severity: signal.severity,
        })),
      };
    });

  return {
    current: {
      total_consultants: activeConsultants.length,
      avg_utilization: avgUtilization,
      active_engagements: activeEngagements.length,
      upcoming_engagements: upcomingEngagements.length,
      bench_count: benchCount,
      at_risk_count: atRiskCount,
      avg_burnout: avgBurnout,
      total_man_days: totalManDays,
    },
    trends,
    practice_areas: practiceAreas,
    engagements: engagementPortfolio,
    at_risk: atRisk,
    deltas: {
      utilization:
        currentTrend.avg_utilization - fourWeeksAgoTrend.avg_utilization,
      engagements:
        currentTrend.active_engagements - fourWeeksAgoTrend.active_engagements,
      bench: currentTrend.bench_count - fourWeeksAgoTrend.bench_count,
      risk: currentTrend.at_risk_count - fourWeeksAgoTrend.at_risk_count,
    },
  };
}
