'use client';

import { useMemo } from 'react';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getCurrentConsultantUtilization } from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';

export function StatsBar() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const consultants = useConsultantStore((s) => s.consultants);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  const stats = useMemo(() => {
    if (!currentUser || currentUser.role !== 'partner') return null;

    let totalAllocation = 0;
    let atRiskCount = 0;
    let availableCount = 0;

    for (const c of consultants) {
      const currentUtilization = getCurrentConsultantUtilization(c.id, assignments);
      totalAllocation += currentUtilization;

      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      if (burnout >= 60) atRiskCount++;

      if (currentUtilization < 50) availableCount++;
    }

    const avgUtilization =
      consultants.length > 0
        ? Math.round(totalAllocation / consultants.length)
        : 0;

    return { avgUtilization, atRiskCount, availableCount, totalConsultants: consultants.length };
  }, [currentUser, consultants, assignments, signals]);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6 px-4 py-2 border-b bg-slate-50/80 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Avg Current UR</span>
        <span className="font-semibold">{stats.avgUtilization}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-muted-foreground">At Risk</span>
        <span className="font-semibold">{stats.atRiskCount}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-muted-foreground">Available</span>
        <span className="font-semibold">{stats.availableCount}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold">{stats.totalConsultants}</span>
      </div>
    </div>
  );
}
