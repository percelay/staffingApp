'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import {
  getAvailableConsultants,
  getTeamSkillCoverage,
  getTotalAllocation,
} from '@/lib/selectors/staffing';
import type { Opportunity, Scenario } from '@/lib/types/opportunity';
import type { Consultant, PracticeArea } from '@/lib/types/consultant';
import type { Assignment, AssignmentRole } from '@/lib/types/assignment';
import type { WellbeingSignal } from '@/lib/types/wellbeing';
import { PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getCurrentConsultantUtilization, formatAllocationAsManDays } from '@/lib/utils/allocation';
import { getStatusColor } from '@/lib/utils/colors';
import { cn } from '@/lib/utils';
import { AvailableStaffingConsultantCard } from '@/components/staffing/shared/staffing-consultant-picker';

interface Props {
  scenario: Scenario;
  opportunity: Opportunity;
  consultants: Consultant[];
  assignments: Assignment[];
  signals: WellbeingSignal[];
}

export function ScenarioEditor({
  scenario,
  opportunity,
  consultants,
  assignments,
  signals,
}: Props) {
  const addTentativeAssignment = useOpportunityStore(
    (s) => s.addTentativeAssignment
  );
  const removeTentativeAssignment = useOpportunityStore(
    (s) => s.removeTentativeAssignment
  );
  const updateTentativeAssignment = useOpportunityStore(
    (s) => s.updateTentativeAssignment
  );
  const engagements = useEngagementStore((s) => s.engagements);

  const [addingMember, setAddingMember] = useState(false);
  const [expandedConsultantId, setExpandedConsultantId] = useState<string | null>(null);
  const [newConsultantId, setNewConsultantId] = useState('');
  const [newRole, setNewRole] = useState<AssignmentRole>('consultant');
  const [newAllocation, setNewAllocation] = useState(100);
  const [practiceFilter, setPracticeFilter] = useState<PracticeArea | 'all'>('all');

  const availableConsultants = useMemo(
    () =>
      getAvailableConsultants(
        consultants,
        scenario.tentative_assignments,
        practiceFilter
      ),
    [consultants, scenario.tentative_assignments, practiceFilter]
  );

  const totalAllocation = getTotalAllocation(scenario.tentative_assignments);

  const handleAdd = async () => {
    if (!newConsultantId) return;
    await addTentativeAssignment(scenario.id, {
      consultant_id: newConsultantId,
      role: newRole,
      start_date: opportunity.start_date,
      end_date: opportunity.end_date,
      allocation_percentage: newAllocation,
    });
    setNewConsultantId('');
    setNewRole('consultant');
    setNewAllocation(100);
    setAddingMember(false);
  };

  // Skill coverage
  const { coveredSkills, missingSkills } = useMemo(
    () =>
      getTeamSkillCoverage(
        consultants,
        scenario.tentative_assignments,
        opportunity.required_skills
      ),
    [consultants, opportunity.required_skills, scenario.tentative_assignments]
  );

  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Tentative Team ({scenario.tentative_assignments.length})
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Team effort: {formatAllocationAsManDays(totalAllocation)} · Weighted
            by {opportunity.probability}% probability
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (addingMember) {
              setExpandedConsultantId(null);
            }
            setAddingMember(!addingMember);
          }}
        >
          {addingMember ? 'Cancel' : '+ Add Consultant'}
        </Button>
      </div>

      {/* Skill coverage */}
      {opportunity.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {coveredSkills.map((s) => (
            <Badge
              key={s}
              className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
              variant="outline"
            >
              {s}
            </Badge>
          ))}
          {missingSkills.map((s) => (
            <Badge
              key={s}
              className="text-[10px] bg-slate-50 text-slate-500 border-slate-200"
              variant="outline"
            >
              {s} (gap)
            </Badge>
          ))}
        </div>
      )}

      {/* Add member panel - reuses staffing workspace patterns */}
      {addingMember && (
        <div className="rounded-lg border bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Add Team Member</Label>
            <Select
              value={practiceFilter}
              onValueChange={(v) => setPracticeFilter(v as PracticeArea | 'all')}
            >
              <SelectTrigger className="w-[140px] h-7 text-[11px]">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {Object.entries(PRACTICE_AREA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[280px] overflow-y-auto border rounded-md">
            {availableConsultants.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No consultants available
              </p>
            ) : (
              availableConsultants.map((consultant) => (
                <AvailableStaffingConsultantCard
                  key={consultant.id}
                  consultant={consultant}
                  staffingWindow={{
                    projectName: opportunity.project_name,
                    startDate: opportunity.start_date,
                    endDate: opportunity.end_date,
                    requiredSkills: opportunity.required_skills,
                  }}
                  allAssignments={assignments}
                  allEngagements={engagements}
                  isSelected={newConsultantId === consultant.id}
                  isExpanded={expandedConsultantId === consultant.id}
                  onSelect={() => {
                    setNewConsultantId((id) =>
                      id === consultant.id ? '' : consultant.id
                    );
                  }}
                  onToggleExpand={() => {
                    setExpandedConsultantId((id) =>
                      id === consultant.id ? null : consultant.id
                    );
                  }}
                />
              ))
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as AssignmentRole)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                Allocation — {newAllocation}%{' '}
                <span className="text-muted-foreground">
                  ({(newAllocation / 20).toFixed(1)}/5 days)
                </span>
              </Label>
              <Input
                type="range"
                min={0}
                max={100}
                step={10}
                value={newAllocation}
                onChange={(e) => setNewAllocation(Number(e.target.value))}
                className="h-8"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newConsultantId}
            className="w-full"
          >
            Add to Tentative Team
          </Button>
        </div>
      )}

      {/* Team roster */}
      {scenario.tentative_assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No consultants assigned to this scenario
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Click &quot;+ Add Consultant&quot; to build a tentative team
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {scenario.tentative_assignments.map((ta) => {
            const consultant = consultants.find(
              (c) => c.id === ta.consultant_id
            );
            if (!consultant) return null;
            const burnout = calculateBurnoutRisk(
              consultant.id,
              assignments,
              signals
            );
            const statusColor = getStatusColor(burnout);
            const currentUtil = getCurrentConsultantUtilization(
              consultant.id,
              assignments
            );
            const projectedUtil = currentUtil + ta.allocation_percentage;

            return (
              <div
                key={ta.id}
                className="rounded-lg border bg-white p-4 space-y-3 border-dashed border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={consultant.avatar_url}
                      alt={consultant.name}
                      className="h-10 w-10 rounded-full bg-slate-100"
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
                    <p className="text-xs text-muted-foreground">
                      {consultant.role} ·{' '}
                      {PRACTICE_AREA_LABELS[consultant.practice_area]}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-dashed">
                    Tentative
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      await removeTentativeAssignment(scenario.id, ta.id);
                    }}
                  >
                    x
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Role
                    </Label>
                    <Select
                      value={ta.role}
                      onValueChange={async (v) =>
                        await updateTentativeAssignment(scenario.id, ta.id, {
                          role: v as AssignmentRole,
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Allocation
                    </Label>
                    <div className="h-7 rounded-md border text-xs font-medium flex items-center justify-center gap-1">
                      {ta.allocation_percentage}%
                      <span className="text-muted-foreground">
                        ({formatAllocationAsManDays(ta.allocation_percentage, 'compact')})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Current UR
                    </Label>
                    <div
                      className={cn(
                        'h-7 rounded-md border flex items-center justify-center text-xs font-bold',
                        currentUtil > 100
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : currentUtil > 80
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                      )}
                    >
                      {currentUtil}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Projected
                    </Label>
                    <div
                      className={cn(
                        'h-7 rounded-md border flex items-center justify-center text-xs font-bold border-dashed',
                        projectedUtil > 100
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : projectedUtil > 80
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-green-50 text-green-700 border-green-300'
                      )}
                    >
                      {projectedUtil}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
