'use client';

import { useEffect, useMemo, useState } from 'react';
import { addWeeks, format, startOfWeek } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CONSULTING_SKILLS,
  OPPORTUNITY_COLOR_PALETTE,
} from '@/lib/constants/staffing';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import type {
  Opportunity,
  OpportunityCreateInput,
  PipelineStage,
  TentativeAssignmentInput,
} from '@/lib/types/opportunity';
import type { AssignmentRole } from '@/lib/types/assignment';
import { PRACTICE_AREA_LABELS, type PracticeArea } from '@/lib/types/consultant';
import {
  ACTIVE_PIPELINE_STAGES,
  PIPELINE_STAGE_LABELS,
} from '@/lib/types/opportunity';
import { formatAllocationAsManDays, getCurrentConsultantUtilization } from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusColor } from '@/lib/utils/colors';
import { cn } from '@/lib/utils';
import { AvailableStaffingConsultantCard } from '@/components/staffing/shared/staffing-consultant-picker';

interface DraftTentativeAssignment extends TentativeAssignmentInput {
  id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOpportunity?: Opportunity;
  onCreated?: (opportunity: Opportunity) => void;
  defaultStage?: PipelineStage;
}

function buildDefaultDates() {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  return {
    startDate: format(addWeeks(now, 2), 'yyyy-MM-dd'),
    endDate: format(addWeeks(now, 10), 'yyyy-MM-dd'),
  };
}

function buildDraftAssignments(
  assignments: TentativeAssignmentInput[] | undefined,
  fallbackStartDate: string,
  fallbackEndDate: string
) {
  return (assignments ?? []).map((assignment) => ({
    id: crypto.randomUUID(),
    consultant_id: assignment.consultant_id,
    role: assignment.role,
    start_date: assignment.start_date || fallbackStartDate,
    end_date: assignment.end_date || fallbackEndDate,
    allocation_percentage: assignment.allocation_percentage ?? 100,
  }));
}

export function CreateOpportunityDialog({
  open,
  onOpenChange,
  editingOpportunity,
  onCreated,
  defaultStage,
}: Props) {
  const addOpportunity = useOpportunityStore((state) => state.addOpportunity);
  const updateOpportunity = useOpportunityStore((state) => state.updateOpportunity);
  const scenarios = useOpportunityStore((state) => state.scenarios);
  const consultants = useConsultantStore((state) => state.consultants);
  const engagements = useEngagementStore((state) => state.engagements);
  const assignments = useAssignmentStore((state) => state.assignments);
  const signals = useWellbeingStore((state) => state.signals);
  const defaultScenario = editingOpportunity
    ? scenarios.find(
        (scenario) =>
          scenario.opportunity_id === editingOpportunity.id && scenario.is_default
      ) ?? scenarios.find((scenario) => scenario.opportunity_id === editingOpportunity.id)
    : undefined;
  const isEditing = Boolean(editingOpportunity);
  const defaultDates = buildDefaultDates();

  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [stage, setStage] = useState<PipelineStage>(defaultStage ?? 'identified');
  const [probability, setProbability] = useState(25);
  const [estimatedValue, setEstimatedValue] = useState('');
  const [color, setColor] = useState<string>(OPPORTUNITY_COLOR_PALETTE[0]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [isBet, setIsBet] = useState(false);
  const [notes, setNotes] = useState('');
  const [defaultTeam, setDefaultTeam] = useState<DraftTentativeAssignment[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [expandedConsultantId, setExpandedConsultantId] = useState<string | null>(null);
  const [newConsultantId, setNewConsultantId] = useState('');
  const [newRole, setNewRole] = useState<AssignmentRole>('consultant');
  const [newAllocation, setNewAllocation] = useState(100);
  const [practiceFilter, setPracticeFilter] = useState<PracticeArea | 'all'>('all');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextStartDate =
      editingOpportunity?.start_date ?? defaultDates.startDate;
    const nextEndDate = editingOpportunity?.end_date ?? defaultDates.endDate;

    setClientName(editingOpportunity?.client_name ?? '');
    setProjectName(editingOpportunity?.project_name ?? '');
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
    setStage(editingOpportunity?.stage ?? defaultStage ?? 'identified');
    setProbability(editingOpportunity?.probability ?? 25);
    setEstimatedValue(editingOpportunity?.estimated_value?.toString() ?? '');
    setColor(editingOpportunity?.color ?? OPPORTUNITY_COLOR_PALETTE[0]);
    setRequiredSkills(editingOpportunity?.required_skills ?? []);
    setIsBet(editingOpportunity?.is_bet ?? false);
    setNotes(editingOpportunity?.notes ?? '');
    setDefaultTeam(
      buildDraftAssignments(
        defaultScenario?.tentative_assignments,
        nextStartDate,
        nextEndDate
      )
    );
    setAddingMember(false);
    setExpandedConsultantId(null);
    setNewConsultantId('');
    setNewRole('consultant');
    setNewAllocation(100);
    setPracticeFilter('all');
  }, [open, editingOpportunity, defaultScenario, defaultStage, defaultDates.endDate, defaultDates.startDate]);

  const availableConsultants = useMemo(
    () => {
      const assignedIds = new Set(
        defaultTeam.map((assignment) => assignment.consultant_id)
      );

      return consultants.filter((consultant) => {
        if (assignedIds.has(consultant.id)) return false;
        if (
          practiceFilter !== 'all' &&
          consultant.practice_area !== practiceFilter
        ) {
          return false;
        }
        return true;
      });
    },
    [consultants, defaultTeam, practiceFilter]
  );

  const totalAllocation = defaultTeam.reduce(
    (sum, assignment) => sum + assignment.allocation_percentage,
    0
  );

  const handleAddTeamMember = () => {
    if (!newConsultantId) {
      return;
    }

    setDefaultTeam((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        consultant_id: newConsultantId,
        role: newRole,
        start_date: startDate,
        end_date: endDate,
        allocation_percentage: newAllocation,
      },
    ]);
    setNewConsultantId('');
    setNewRole('consultant');
    setNewAllocation(100);
    setExpandedConsultantId(null);
    setAddingMember(false);
  };

  const handleUpdateTeamMember = (
    assignmentId: string,
    data: Partial<DraftTentativeAssignment>
  ) => {
    setDefaultTeam((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId ? { ...assignment, ...data } : assignment
      )
    );
  };

  const handleRemoveTeamMember = (assignmentId: string) => {
    setDefaultTeam((current) =>
      current.filter((assignment) => assignment.id !== assignmentId)
    );
  };

  const handleSubmit = async () => {
    const payload: OpportunityCreateInput = {
      client_name: clientName || 'New Client',
      project_name: projectName || 'New Opportunity',
      start_date: startDate,
      end_date: endDate,
      stage,
      probability,
      estimated_value: estimatedValue ? Number(estimatedValue) : null,
      color,
      is_bet: isBet,
      notes: notes.trim() || null,
      required_skills: requiredSkills,
      converted_engagement_id: null,
      default_scenario: {
        name: defaultScenario?.name ?? 'Primary Team',
        tentative_assignments: defaultTeam.map((assignment) => ({
          consultant_id: assignment.consultant_id,
          role: assignment.role,
          start_date: startDate,
          end_date: endDate,
          allocation_percentage: assignment.allocation_percentage,
        })),
      },
    };

    setSaving(true);
    try {
      if (isEditing && editingOpportunity) {
        await updateOpportunity(editingOpportunity.id, payload);
      } else {
        const created = await addOpportunity(payload);
        onCreated?.(created);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save opportunity:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(94vh,980px)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:w-[min(96vw,1320px)] sm:max-w-[1320px]">
        <DialogHeader className="border-b px-6 py-5 pr-14 sm:px-8 sm:py-6">
          <DialogTitle>
            {isEditing ? 'Edit Opportunity' : 'New Opportunity'}
          </DialogTitle>
          <DialogDescription className="max-w-2xl">
            Capture opportunity details and build the default staffing plan in one
            place.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.95fr)]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Client Name</Label>
                  <Input
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Project Name</Label>
                  <Input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="e.g. M&A Due Diligence"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Expected Start</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Expected End</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs">Pipeline Stage</Label>
                  <Select
                    value={stage}
                    onValueChange={(value) => setStage(value as PipelineStage)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVE_PIPELINE_STAGES.map((pipelineStage) => (
                        <SelectItem key={pipelineStage} value={pipelineStage}>
                          {PIPELINE_STAGE_LABELS[pipelineStage]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">
                    Win Probability — {probability}%
                  </Label>
                  <Input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={probability}
                    onChange={(event) =>
                      setProbability(Number(event.target.value))
                    }
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estimated Value ($)</Label>
                  <Input
                    type="number"
                    value={estimatedValue}
                    onChange={(event) => setEstimatedValue(event.target.value)}
                    placeholder="e.g. 500000"
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {OPPORTUNITY_COLOR_PALETTE.map((paletteColor) => (
                      <button
                        key={paletteColor}
                        type="button"
                        className={`h-7 w-7 rounded-md border-2 transition-all ${
                          color === paletteColor
                            ? 'scale-110 border-foreground'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: paletteColor }}
                        onClick={() => setColor(paletteColor)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-xs">Bet</Label>
                    <p className="text-xs text-muted-foreground">
                      Mark this opportunity as a strategic bet
                    </p>
                  </div>
                  <Switch checked={isBet} onCheckedChange={setIsBet} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Required Skills</Label>
                <div className="max-h-40 overflow-y-auto rounded-md border p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {CONSULTING_SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={
                          requiredSkills.includes(skill) ? 'default' : 'outline'
                        }
                        className="cursor-pointer text-xs transition-colors"
                        onClick={() =>
                          setRequiredSkills((current) =>
                            current.includes(skill)
                              ? current.filter((item) => item !== skill)
                              : [...current, skill]
                          )
                        }
                      >
                        {requiredSkills.includes(skill) ? `${skill} x` : `+ ${skill}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Notes</Label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Context, partners, constraints, or client notes..."
                  className="min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </div>
            </div>

            <div className="space-y-5 rounded-2xl border bg-slate-50/40 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Default Staffing ({defaultTeam.length})
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Team effort: {formatAllocationAsManDays(totalAllocation)}
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

              {addingMember && (
                <div className="space-y-4 rounded-xl border bg-white p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="text-sm font-medium">Add Team Member</Label>
                    <Select
                      value={practiceFilter}
                      onValueChange={(value) =>
                        setPracticeFilter(value as PracticeArea | 'all')
                      }
                    >
                      <SelectTrigger className="h-9 w-full text-xs sm:w-[180px]">
                        <SelectValue placeholder="Filter..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Areas</SelectItem>
                        {Object.entries(PRACTICE_AREA_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto rounded-lg border">
                    {availableConsultants.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        No consultants available
                      </p>
                    ) : (
                      availableConsultants.map((consultant) => (
                        <AvailableStaffingConsultantCard
                          key={consultant.id}
                          consultant={consultant}
                          staffingWindow={{
                            projectName: projectName || 'New Opportunity',
                            startDate,
                            endDate,
                            requiredSkills,
                          }}
                          allAssignments={assignments}
                          allEngagements={engagements}
                          isSelected={newConsultantId === consultant.id}
                          isExpanded={expandedConsultantId === consultant.id}
                          onSelect={() => {
                            setNewConsultantId((currentId) =>
                              currentId === consultant.id ? '' : consultant.id
                            );
                          }}
                          onToggleExpand={() => {
                            setExpandedConsultantId((currentId) =>
                              currentId === consultant.id ? null : consultant.id
                            );
                          }}
                        />
                      ))
                    )}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <Label className="text-xs">Role</Label>
                      <Select
                        value={newRole}
                        onValueChange={(value) =>
                          setNewRole(value as AssignmentRole)
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
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
                        onChange={(event) =>
                          setNewAllocation(Number(event.target.value))
                        }
                        className="h-8"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddTeamMember}
                    disabled={!newConsultantId}
                    className="w-full sm:w-auto"
                  >
                    Add to Default Team
                  </Button>
                </div>
              )}

              {defaultTeam.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No consultants assigned yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Click &quot;+ Add Consultant&quot; to build the initial staffing
                    plan
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {defaultTeam.map((assignment) => {
                    const consultant = consultants.find(
                      (candidate) => candidate.id === assignment.consultant_id
                    );
                    if (!consultant) {
                      return null;
                    }

                    const burnout = calculateBurnoutRisk(
                      consultant.id,
                      assignments,
                      signals
                    );
                    const statusColor = getStatusColor(burnout);
                    const currentUtilization = getCurrentConsultantUtilization(
                      consultant.id,
                      assignments
                    );
                    const projectedUtilization =
                      currentUtilization + assignment.allocation_percentage;

                    return (
                      <div
                        key={assignment.id}
                        className="space-y-4 rounded-xl border border-dashed border-slate-300 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start gap-3">
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
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {consultant.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {consultant.role} ·{' '}
                              {PRACTICE_AREA_LABELS[consultant.practice_area]}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-dashed text-[10px]"
                            >
                              Tentative
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveTeamMember(assignment.id)}
                            >
                              x
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              Role
                            </Label>
                            <Select
                              value={assignment.role}
                              onValueChange={(value) =>
                                handleUpdateTeamMember(assignment.id, {
                                  role: value as AssignmentRole,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="consultant">
                                  Consultant
                                </SelectItem>
                                <SelectItem value="analyst">Analyst</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              Allocation
                            </Label>
                            <div className="space-y-1">
                              <div className="flex h-8 items-center justify-center rounded-md border text-xs font-medium">
                                {assignment.allocation_percentage}%{' '}
                                <span className="ml-1 text-muted-foreground">
                                  (
                                  {formatAllocationAsManDays(
                                    assignment.allocation_percentage,
                                    'compact'
                                  )}
                                  )
                                </span>
                              </div>
                              <Input
                                type="range"
                                min={0}
                                max={100}
                                step={10}
                                value={assignment.allocation_percentage}
                                onChange={(event) =>
                                  handleUpdateTeamMember(assignment.id, {
                                    allocation_percentage: Number(
                                      event.target.value
                                    ),
                                  })
                                }
                                className="h-7"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              Current UR
                            </Label>
                            <div
                              className={cn(
                                'flex h-8 items-center justify-center rounded-md border text-xs font-bold',
                                currentUtilization > 100
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : currentUtilization > 80
                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                    : 'border-green-200 bg-green-50 text-green-700'
                              )}
                            >
                              {currentUtilization}%
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              Projected
                            </Label>
                            <div
                              className={cn(
                                'flex h-8 items-center justify-center rounded-md border border-dashed text-xs font-bold',
                                projectedUtilization > 100
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : projectedUtilization > 80
                                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                                    : 'border-green-300 bg-green-50 text-green-700'
                              )}
                            >
                              {projectedUtilization}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-background px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="sm:min-w-44">
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Create Opportunity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
