'use client';

import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/lib/stores/ui-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { useProposalStore } from '@/lib/stores/proposal-store';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusColor, getStatusLabel } from '@/lib/utils/colors';
import { SENIORITY_LABELS } from '@/lib/types/consultant';
import { format, parseISO, differenceInWeeks } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  upcoming: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  at_risk: 'bg-red-100 text-red-800',
};

export function EngagementDrawer() {
  const router = useRouter();
  const drawerOpen = useUIStore((s) => s.drawerOpen);
  const setDrawerOpen = useUIStore((s) => s.setDrawerOpen);
  const selectedId = useUIStore((s) => s.selectedEngagementId);
  const engagements = useEngagementStore((s) => s.engagements);
  const consultants = useConsultantStore((s) => s.consultants);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  const engagement = selectedId
    ? engagements.find((e) => e.id === selectedId)
    : undefined;
  const assignmentsByEngagement = selectedId
    ? assignments.filter((a) => a.engagement_id === selectedId)
    : [];
  const setProposalEngagement = useProposalStore((s) => s.setEngagementId);

  if (!engagement) {
    return (
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>No engagement selected</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const duration = differenceInWeeks(
    parseISO(engagement.end_date),
    parseISO(engagement.start_date)
  );

  const teamMembers = assignmentsByEngagement.map((a) => {
    const consultant = consultants.find((c) => c.id === a.consultant_id);
    const burnout = consultant
      ? calculateBurnoutRisk(consultant.id, assignments, signals)
      : 0;
    return { assignment: a, consultant, burnout };
  });

  const handleViewGraph = () => {
    setDrawerOpen(false);
    router.push(`/graph?engagement=${engagement.id}`);
  };

  const handleStaffEngagement = () => {
    setDrawerOpen(false);
    setProposalEngagement(engagement.id);
    router.push('/staffing');
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent className="w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: engagement.color }}
            />
            <Badge
              variant="secondary"
              className={STATUS_COLORS[engagement.status] || ''}
            >
              {engagement.status.replace('_', ' ')}
            </Badge>
          </div>
          <SheetTitle className="text-xl tracking-tight leading-tight">
            {engagement.client_name}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {engagement.project_name}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Date range */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Timeline
            </p>
            <p className="text-sm">
              {format(parseISO(engagement.start_date), 'MMM d, yyyy')} —{' '}
              {format(parseISO(engagement.end_date), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {duration} weeks
            </p>
          </div>

          {/* Required skills */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {engagement.required_skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Team */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Assigned Team ({teamMembers.length})
            </p>
            <div className="space-y-3">
              {teamMembers.map(({ assignment, consultant, burnout }) => {
                if (!consultant) return null;
                const statusColor = getStatusColor(burnout);
                const statusLabel = getStatusLabel(burnout);

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={consultant.avatar_url}
                        alt={consultant.name}
                        className="h-9 w-9 rounded-full bg-slate-100"
                      />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: statusColor }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {consultant.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {SENIORITY_LABELS[consultant.seniority_level]} ·{' '}
                        {assignment.role} · {assignment.allocation_percentage}%
                      </p>
                    </div>
                    {statusLabel !== 'healthy' && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          statusLabel === 'at_risk'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {statusLabel === 'at_risk' ? 'At Risk' : 'Watch'}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleViewGraph} className="w-full">
              View in Graph
            </Button>
            <Button
              variant="outline"
              onClick={handleStaffEngagement}
              className="w-full"
            >
              Staff this Engagement
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
