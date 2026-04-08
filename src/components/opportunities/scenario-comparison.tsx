'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { Opportunity, Scenario } from '@/lib/types/opportunity';
import type { Consultant } from '@/lib/types/consultant';
import type { Assignment } from '@/lib/types/assignment';
import type { WellbeingSignal } from '@/lib/types/wellbeing';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { formatAllocationAsManDays } from '@/lib/utils/allocation';
import { getCapacityConflicts } from '@/lib/utils/impact';
import { cn } from '@/lib/utils';

interface Props {
  scenarios: Scenario[];
  opportunity: Opportunity;
  consultants: Consultant[];
  assignments: Assignment[];
  signals: WellbeingSignal[];
  activeScenarioId: string | null;
  onSelectScenario: (id: string) => void;
}

interface ScenarioMetrics {
  teamSize: number;
  totalAllocation: number;
  avgBurnout: number;
  conflictCount: number;
  skillCoverage: number;
  hasLead: boolean;
  hasManager: boolean;
}

export function ScenarioComparison({
  scenarios,
  opportunity,
  consultants,
  assignments,
  signals,
  activeScenarioId,
  onSelectScenario,
}: Props) {
  const metricsMap = useMemo(() => {
    const map = new Map<string, ScenarioMetrics>();

    for (const sc of scenarios) {
      const teamConsultants = sc.tentative_assignments
        .map((ta) => consultants.find((c) => c.id === ta.consultant_id))
        .filter((c): c is Consultant => c !== undefined);

      const totalAllocation = sc.tentative_assignments.reduce(
        (sum, ta) => sum + ta.allocation_percentage,
        0
      );

      const avgBurnout =
        teamConsultants.length > 0
          ? Math.round(
              teamConsultants.reduce(
                (sum, c) =>
                  sum + calculateBurnoutRisk(c.id, assignments, signals),
                0
              ) / teamConsultants.length
            )
          : 0;

      const conflicts = getCapacityConflicts(sc, assignments);

      const teamSkills = new Set(teamConsultants.flatMap((c) => c.skills));
      const covered = opportunity.required_skills.filter((s) =>
        teamSkills.has(s)
      );
      const skillCoverage =
        opportunity.required_skills.length > 0
          ? Math.round(
              (covered.length / opportunity.required_skills.length) * 100
            )
          : 100;

      const hasLead = sc.tentative_assignments.some((ta) => ta.role === 'lead');
      const hasManager = sc.tentative_assignments.some(
        (ta) => ta.role === 'manager'
      );

      map.set(sc.id, {
        teamSize: sc.tentative_assignments.length,
        totalAllocation,
        avgBurnout,
        conflictCount: conflicts.length,
        skillCoverage,
        hasLead,
        hasManager,
      });
    }

    return map;
  }, [scenarios, opportunity, consultants, assignments, signals]);

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
        Scenario Comparison
      </Label>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((sc) => {
          const metrics = metricsMap.get(sc.id);
          if (!metrics) return null;
          const isActive = sc.id === activeScenarioId;

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={cn(
                'text-left rounded-lg border p-4 transition-all',
                isActive
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'bg-white hover:border-slate-300 hover:shadow-sm'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{sc.name}</span>
                {sc.is_default && (
                  <Badge variant="secondary" className="text-[10px]">
                    Default
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MetricCell
                  label="Team Size"
                  value={String(metrics.teamSize)}
                />
                <MetricCell
                  label="Effort"
                  value={formatAllocationAsManDays(
                    metrics.totalAllocation,
                    'compact'
                  )}
                />
                <MetricCell
                  label="Skill Coverage"
                  value={`${metrics.skillCoverage}%`}
                  tone={
                    metrics.skillCoverage >= 80
                      ? 'green'
                      : metrics.skillCoverage >= 50
                        ? 'amber'
                        : 'red'
                  }
                />
                <MetricCell
                  label="Avg Burnout"
                  value={`${metrics.avgBurnout}`}
                  tone={
                    metrics.avgBurnout >= 70
                      ? 'red'
                      : metrics.avgBurnout >= 40
                        ? 'amber'
                        : 'green'
                  }
                />
              </div>

              {metrics.conflictCount > 0 && (
                <div className="mt-2 text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                  {metrics.conflictCount} overallocation{' '}
                  {metrics.conflictCount === 1 ? 'conflict' : 'conflicts'}
                </div>
              )}

              <div className="flex gap-1.5 mt-2">
                {metrics.hasLead && (
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Has Lead
                  </span>
                )}
                {metrics.hasManager && (
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Has Manager
                  </span>
                )}
                {!metrics.hasLead && !metrics.hasManager && (
                  <span className="text-[10px] text-slate-400">
                    No leadership roles
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'green' | 'amber' | 'red';
}) {
  const colorClass = tone
    ? tone === 'green'
      ? 'text-green-700'
      : tone === 'amber'
        ? 'text-amber-700'
        : 'text-red-700'
    : '';

  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold', colorClass)}>{value}</p>
    </div>
  );
}
