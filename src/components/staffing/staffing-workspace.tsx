'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { useProposalStore } from '@/lib/stores/proposal-store';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { calculateFitScore, type FitScoreBreakdown } from '@/lib/utils/scoring';
import { getAverageAvailability } from '@/lib/utils/availability';
import { getStatusColor } from '@/lib/utils/colors';
import { SENIORITY_LABELS, PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import type { PracticeArea } from '@/lib/types/consultant';
import type { AssignmentRole } from '@/lib/types/assignment';
import { parseISO } from 'date-fns';

const ROLE_LABELS: Record<AssignmentRole, string> = {
  lead: 'Lead',
  manager: 'Manager',
  consultant: 'Consultant',
  analyst: 'Analyst',
};

function FitScoreCircle({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? '#059669' : score >= 40 ? '#D97706' : '#DC2626';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={100} height={100} className="-rotate-90">
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={6}
        />
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 100, height: 100 }}>
        <span className="text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground">Fit Score</span>
      </div>
    </div>
  );
}

export function StaffingWorkspace() {
  const [practiceFilter, setPracticeFilter] = useState<PracticeArea | 'all'>('all');
  const [showSummary, setShowSummary] = useState(false);
  const [draggedConsultantId, setDraggedConsultantId] = useState<string | null>(null);

  const consultants = useConsultantStore((s) => s.consultants);
  const engagements = useEngagementStore((s) => s.engagements);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  const engagementId = useProposalStore((s) => s.engagementId);
  const slots = useProposalStore((s) => s.slots);
  const setEngagementId = useProposalStore((s) => s.setEngagementId);
  const addToSlot = useProposalStore((s) => s.addToSlot);
  const removeFromSlot = useProposalStore((s) => s.removeFromSlot);

  const selectedEngagement = engagementId
    ? engagements.find((e) => e.id === engagementId)
    : null;

  // Filter available consultants
  const availableConsultants = useMemo(() => {
    let filtered = consultants;
    if (practiceFilter !== 'all') {
      filtered = filtered.filter((c) => c.practice_area === practiceFilter);
    }
    // Exclude already assigned to slots
    const assignedIds = new Set(
      slots.filter((s) => s.consultant_id).map((s) => s.consultant_id!)
    );
    filtered = filtered.filter((c) => !assignedIds.has(c.id));

    return filtered.map((c) => {
      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      let availability = 100;
      if (selectedEngagement) {
        availability = getAverageAvailability(
          c.id,
          assignments,
          parseISO(selectedEngagement.start_date),
          parseISO(selectedEngagement.end_date)
        );
      }
      const skillMatch = selectedEngagement
        ? selectedEngagement.required_skills.filter((s) => c.skills.includes(s))
        : [];
      return { consultant: c, burnout, availability, skillMatch };
    });
  }, [
    consultants,
    practiceFilter,
    slots,
    assignments,
    signals,
    selectedEngagement,
  ]);

  // Calculate fit score
  const fitScore: FitScoreBreakdown | null = useMemo(() => {
    if (!selectedEngagement) return null;
    return calculateFitScore(
      slots,
      selectedEngagement,
      consultants,
      assignments,
      signals
    );
  }, [slots, selectedEngagement, consultants, assignments, signals]);

  const hasAnyAssignment = slots.some((s) => s.consultant_id !== null);

  const handleDragStart = (consultantId: string) => {
    setDraggedConsultantId(consultantId);
  };

  const handleDrop = (slotIndex: number) => {
    if (draggedConsultantId) {
      addToSlot(slotIndex, draggedConsultantId);
      setDraggedConsultantId(null);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel: Available consultants */}
      <div className="flex-1 flex flex-col border-r overflow-hidden">
        <div className="p-4 border-b bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Available Consultants</h2>
            <Select
              value={practiceFilter}
              onValueChange={(v) => setPracticeFilter(v as PracticeArea | 'all')}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Practice Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Practice Areas</SelectItem>
                {Object.entries(PRACTICE_AREA_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Engagement selector */}
          <Select
            value={engagementId || ''}
            onValueChange={(v) => setEngagementId(v)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select an engagement to staff..." />
            </SelectTrigger>
            <SelectContent>
              {engagements.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: e.color }}
                    />
                    {e.client_name} — {e.project_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {availableConsultants.map(
            ({ consultant, burnout, availability, skillMatch }) => {
              const statusColor = getStatusColor(burnout);
              return (
                <div
                  key={consultant.id}
                  draggable
                  onDragStart={() => handleDragStart(consultant.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 hover:border-primary/20 cursor-grab active:cursor-grabbing transition-all"
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        {SENIORITY_LABELS[consultant.seniority_level]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        · {Math.round(availability)}% avail.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {consultant.practice_area}
                    </Badge>
                    {selectedEngagement && skillMatch.length > 0 && (
                      <span className="text-[10px] text-green-600 font-medium">
                        {skillMatch.length}/{selectedEngagement.required_skills.length} skills
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}

          {availableConsultants.length === 0 && (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No available consultants
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Proposal card */}
      <div className="w-[400px] flex flex-col overflow-hidden bg-slate-50/50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-sm font-semibold">Staffing Proposal</h2>
          {selectedEngagement && (
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedEngagement.color }}
                />
                <span className="text-sm font-medium">
                  {selectedEngagement.client_name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-[18px]">
                {selectedEngagement.project_name}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Fit score */}
          {fitScore && hasAnyAssignment && (
            <div className="flex justify-center">
              <div className="relative">
                <FitScoreCircle score={fitScore.total} />
              </div>
            </div>
          )}

          {/* Sub-indicators */}
          {fitScore && hasAnyAssignment && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border">
                <p className="text-lg font-bold">{fitScore.skillCoverage}/40</p>
                <p className="text-[10px] text-muted-foreground">Skills</p>
              </div>
              <div className="p-2 rounded-lg bg-white border">
                <p className="text-lg font-bold">{fitScore.seniorityBalance}/30</p>
                <p className="text-[10px] text-muted-foreground">Seniority</p>
              </div>
              <div className="p-2 rounded-lg bg-white border">
                <p className="text-lg font-bold">{fitScore.burnoutRisk}%</p>
                <p className="text-[10px] text-muted-foreground">Burnout</p>
              </div>
            </div>
          )}

          {fitScore && fitScore.missingSkills.length > 0 && hasAnyAssignment && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Missing Skills
              </p>
              <div className="flex flex-wrap gap-1">
                {fitScore.missingSkills.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Role slots */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Team Roles
            </p>
            {slots.map((slot, i) => {
              const consultant = slot.consultant_id
                ? consultants.find((c) => c.id === slot.consultant_id)
                : null;

              return (
                <div
                  key={i}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                    handleDrop(i);
                  }}
                  className={`rounded-lg border-2 border-dashed p-3 transition-colors ${
                    consultant
                      ? 'border-solid border-slate-200 bg-white'
                      : 'border-slate-200 bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      {ROLE_LABELS[slot.role]}
                    </span>
                    {slot.required && !consultant && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] bg-amber-50 text-amber-600"
                      >
                        Required
                      </Badge>
                    )}
                  </div>

                  {consultant ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={consultant.avatar_url}
                        alt={consultant.name}
                        className="h-7 w-7 rounded-full bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {consultant.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {SENIORITY_LABELS[consultant.seniority_level]}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromSlot(i)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Drag a consultant here
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Review button */}
          {hasAnyAssignment && (
            <Button
              className="w-full"
              onClick={() => setShowSummary(true)}
            >
              Review Proposal
            </Button>
          )}
        </div>
      </div>

      {/* Summary dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="tracking-tight">Proposal Summary</DialogTitle>
          </DialogHeader>

          {selectedEngagement && fitScore && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: selectedEngagement.color }}
                />
                <div>
                  <p className="font-semibold">{selectedEngagement.client_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEngagement.project_name}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-center">
                <div className="relative">
                  <FitScoreCircle score={fitScore.total} />
                </div>
              </div>

              <div className="space-y-2">
                {slots
                  .filter((s) => s.consultant_id)
                  .map((slot, i) => {
                    const c = consultants.find(
                      (con) => con.id === slot.consultant_id
                    );
                    if (!c) return null;
                    const burnout = calculateBurnoutRisk(
                      c.id,
                      assignments,
                      signals
                    );
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50"
                      >
                        <img
                          src={c.avatar_url}
                          alt={c.name}
                          className="h-8 w-8 rounded-full bg-slate-100"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {ROLE_LABELS[slot.role]} ·{' '}
                            {SENIORITY_LABELS[c.seniority_level]}
                          </p>
                        </div>
                        {burnout >= 60 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-red-100 text-red-700"
                          >
                            Risk
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>

              {fitScore.missingSkills.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 mb-1">
                    Skill Gaps
                  </p>
                  <p className="text-xs text-amber-700">
                    {fitScore.missingSkills.join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSummary(false)}
                >
                  Edit
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowSummary(false);
                  }}
                >
                  Confirm Proposal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
