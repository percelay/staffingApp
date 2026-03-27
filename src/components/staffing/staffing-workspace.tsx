'use client';

import { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { format, addWeeks, startOfWeek, parseISO, differenceInWeeks } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import {
  formatAllocationAsManDays,
  getCurrentConsultantUtilization,
} from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getAverageAvailability, getWeeklyAllocations } from '@/lib/utils/availability';
import { getStatusColor } from '@/lib/utils/colors';
import { datesOverlap, getWeekLabel, isWithinRange } from '@/lib/utils/date-helpers';
import { SENIORITY_LABELS, PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import type { Consultant, PracticeArea } from '@/lib/types/consultant';
import {
  ENGAGEMENT_STATUS_LABELS,
  ENGAGEMENT_STATUS_OPTIONS,
  type Engagement,
  type EngagementStatus,
} from '@/lib/types/engagement';
import type { Assignment, AssignmentRole } from '@/lib/types/assignment';
import type { WellbeingSignal } from '@/lib/types/wellbeing';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_SKILLS = [
  'Financial Modeling', 'Change Management', 'Data Analytics', 'Due Diligence',
  'Process Optimization', 'Digital Strategy', 'Stakeholder Management', 'Market Analysis',
  'Risk Assessment', 'Supply Chain', 'M&A Integration', 'Cost Reduction',
  'Agile Transformation', 'Cloud Migration', 'People Analytics', 'Regulatory Compliance',
  'Revenue Growth', 'Customer Experience', 'Organizational Design', 'Performance Management',
];

const COLOR_PALETTE = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#2563EB',
  '#EA580C', '#65A30D',
];

// ─── Main Component ─────────────────────────────────────────────────────────

export function StaffingWorkspace() {
  const consultants = useConsultantStore((s) => s.consultants);
  const engagements = useEngagementStore((s) => s.engagements);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  const addEngagement = useEngagementStore((s) => s.addEngagement);
  const updateEngagement = useEngagementStore((s) => s.updateEngagement);
  const removeEngagement = useEngagementStore((s) => s.removeEngagement);
  const createAssignment = useAssignmentStore((s) => s.createAssignment);
  const updateAssignment = useAssignmentStore((s) => s.updateAssignment);
  const removeAssignment = useAssignmentStore((s) => s.removeAssignment);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'all'>('all');

  const selectedEngagement = selectedId
    ? engagements.find((e) => e.id === selectedId) ?? null
    : null;

  // Filtered engagement list
  const filteredEngagements = useMemo(() => {
    let list = [...engagements];
    if (statusFilter !== 'all') {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.client_name.toLowerCase().includes(q) ||
          e.project_name.toLowerCase().includes(q)
      );
    }
    const order: Record<EngagementStatus, number> = {
      active: 0,
      upcoming: 1,
      completed: 2,
    };
    list.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    return list;
  }, [engagements, statusFilter, searchQuery]);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* ── LEFT: Engagement List ── */}
      <div className="w-[340px] flex flex-col border-r bg-white overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Projects</h2>
            <Button size="sm" onClick={() => setShowNewDialog(true)}>
              + New
            </Button>
          </div>
          <Input
            placeholder="Search clients or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as EngagementStatus | 'all')}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ENGAGEMENT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                    {s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {filteredEngagements.map((eng) => {
              const teamCount = assignments.filter((a) => a.engagement_id === eng.id).length;
              const isSelected = selectedId === eng.id;
              const weeks = differenceInWeeks(parseISO(eng.end_date), parseISO(eng.start_date));
              return (
                <button
                  key={eng.id}
                  onClick={() => setSelectedId(eng.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: eng.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{eng.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{eng.project_name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {ENGAGEMENT_STATUS_LABELS[eng.status]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {teamCount} member{teamCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{weeks}w</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredEngagements.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p className="text-sm">No projects found</p>
                <Button variant="link" size="sm" className="mt-1" onClick={() => setShowNewDialog(true)}>
                  Create one
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── RIGHT: Selected Engagement Detail ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 min-h-0">
        {selectedEngagement ? (
          <EngagementDetail
            engagement={selectedEngagement}
            allEngagements={engagements}
            engAssignments={assignments.filter((a) => a.engagement_id === selectedEngagement.id)}
            allAssignments={assignments}
            consultants={consultants}
            signals={signals}
            onUpdate={updateEngagement}
            onDelete={async () => { await removeEngagement(selectedEngagement.id); setSelectedId(null); }}
            onCreateAssignment={createAssignment}
            onUpdateAssignment={updateAssignment}
            onRemoveAssignment={removeAssignment}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">Select a project</p>
              <p className="text-sm text-muted-foreground/70 mt-1">or create a new one to get started</p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>+ New Project</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── New Engagement Dialog ── */}
      <NewEngagementDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={(eng) => { setSelectedId(eng.id); setShowNewDialog(false); }}
        addEngagement={addEngagement}
      />
    </div>
  );
}

// ─── Engagement Detail Panel ────────────────────────────────────────────────

interface DetailProps {
  engagement: Engagement;
  allEngagements: Engagement[];
  engAssignments: Assignment[];
  allAssignments: Assignment[];
  consultants: Consultant[];
  signals: WellbeingSignal[];
  onUpdate: (id: string, data: Partial<Engagement>) => Promise<void>;
  onDelete: () => Promise<void>;
  onCreateAssignment: (data: Omit<Assignment, 'id'>) => Promise<unknown>;
  onUpdateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  onRemoveAssignment: (id: string) => Promise<void>;
}

function EngagementDetail({
  engagement, allEngagements, engAssignments, allAssignments, consultants, signals,
  onUpdate, onDelete, onCreateAssignment, onUpdateAssignment, onRemoveAssignment,
}: DetailProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [expandedConsultantId, setExpandedConsultantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState(engagement.client_name);
  const [projectName, setProjectName] = useState(engagement.project_name);
  const [startDate, setStartDate] = useState(engagement.start_date);
  const [endDate, setEndDate] = useState(engagement.end_date);
  const [status, setStatus] = useState(engagement.status);
  const [color, setColor] = useState(engagement.color);
  const [requiredSkills, setRequiredSkills] = useState([...engagement.required_skills]);

  const [newConsultantId, setNewConsultantId] = useState('');
  const [newRole, setNewRole] = useState<AssignmentRole>('consultant');
  const [newAllocation, setNewAllocation] = useState(100);
  const [practiceFilter, setPracticeFilter] = useState<PracticeArea | 'all'>('all');

  // Reset when engagement changes
  const engId = engagement.id;
  const [lastEngId, setLastEngId] = useState(engId);
  if (engId !== lastEngId) {
    setLastEngId(engId);
    setClientName(engagement.client_name);
    setProjectName(engagement.project_name);
    setStartDate(engagement.start_date);
    setEndDate(engagement.end_date);
    setStatus(engagement.status);
    setColor(engagement.color);
    setRequiredSkills([...engagement.required_skills]);
    setEditing(false);
    setConfirmDelete(false);
    setAddingMember(false);
    setExpandedConsultantId(null);
  }

  const assignedIds = new Set(engAssignments.map((a) => a.consultant_id));
  const availableConsultants = consultants.filter((c) => {
    if (assignedIds.has(c.id)) return false;
    if (practiceFilter !== 'all' && c.practice_area !== practiceFilter) return false;
    return true;
  });

  const totalAllocation = engAssignments.reduce((sum, a) => sum + a.allocation_percentage, 0);
  const weeks = differenceInWeeks(parseISO(engagement.end_date), parseISO(engagement.start_date));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(engagement.id, {
        client_name: clientName || undefined,
        project_name: projectName || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status, color,
        required_skills: requiredSkills,
      });
      setEditing(false);
    } catch (e) { console.error('Save failed:', e); }
    finally { setSaving(false); }
  };

  const cancelEdit = () => {
    setEditing(false);
    setClientName(engagement.client_name);
    setProjectName(engagement.project_name);
    setStartDate(engagement.start_date);
    setEndDate(engagement.end_date);
    setStatus(engagement.status);
    setColor(engagement.color);
    setRequiredSkills([...engagement.required_skills]);
  };

  const handleAddMember = async () => {
    if (!newConsultantId) return;
    await onCreateAssignment({
      consultant_id: newConsultantId,
      engagement_id: engagement.id,
      role: newRole,
      start_date: engagement.start_date,
      end_date: engagement.end_date,
      allocation_percentage: newAllocation,
    });
    setNewConsultantId('');
    setNewRole('consultant');
    setNewAllocation(100);
    setAddingMember(false);
  };

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-6 max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full mt-1 shrink-0" style={{ backgroundColor: engagement.color }} />
            <div>
              {editing ? (
                <div className="space-y-2">
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" className="h-8 text-sm font-semibold" />
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" className="h-8 text-sm" />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold tracking-tight">{engagement.client_name}</h2>
                  <p className="text-sm text-muted-foreground">{engagement.project_name}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant={confirmDelete ? 'destructive' : 'outline'} onClick={async () => {
                  if (!confirmDelete) { setConfirmDelete(true); return; }
                  await onDelete();
                }}>
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AttrCard label="Status">
            {editing ? (
              <Select value={status} onValueChange={(v) => setStatus(v as EngagementStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${s.dotClass}`} />{s.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className="capitalize text-xs">{ENGAGEMENT_STATUS_LABELS[engagement.status]}</Badge>
            )}
          </AttrCard>
          <AttrCard label="Start Date">
            {editing ? (
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
            ) : (
              <span className="text-sm font-medium">{format(parseISO(engagement.start_date), 'MMM d, yyyy')}</span>
            )}
          </AttrCard>
          <AttrCard label="End Date">
            {editing ? (
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs" />
            ) : (
              <span className="text-sm font-medium">{format(parseISO(engagement.end_date), 'MMM d, yyyy')}</span>
            )}
          </AttrCard>
          <AttrCard label="Duration">
            <span className="text-sm font-medium">{weeks} weeks</span>
          </AttrCard>
        </div>

        {editing && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Color</Label>
            <div className="flex gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button key={c} className={`w-7 h-7 rounded-md border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Required Skills */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Required Skills ({requiredSkills.length})</Label>
          {editing ? (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border rounded-md p-3">
              {ALL_SKILLS.map((skill) => (
                <Badge key={skill} variant={requiredSkills.includes(skill) ? 'default' : 'outline'} className="cursor-pointer transition-colors text-xs"
                  onClick={() => setRequiredSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])}>
                  {requiredSkills.includes(skill) ? skill + ' x' : '+ ' + skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {engagement.required_skills.length > 0
                ? engagement.required_skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)
                : <span className="text-sm text-muted-foreground italic">None specified</span>}
            </div>
          )}
        </div>

        <Separator />

        {/* Team */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Team ({engAssignments.length})</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
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
            <div className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Add Team Member</Label>
                <Select value={practiceFilter} onValueChange={(v) => setPracticeFilter(v as PracticeArea | 'all')}>
                  <SelectTrigger className="w-[140px] h-7 text-[11px]"><SelectValue placeholder="Filter..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    {Object.entries(PRACTICE_AREA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-[320px] overflow-y-auto border rounded-md">
                {availableConsultants.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No consultants available</p>
                ) : (
                  availableConsultants.map((consultant) => (
                    <AvailableConsultantCard
                      key={consultant.id}
                      consultant={consultant}
                      engagement={engagement}
                      allAssignments={allAssignments}
                      allEngagements={allEngagements}
                      isSelected={newConsultantId === consultant.id}
                      isExpanded={expandedConsultantId === consultant.id}
                      onSelect={() => {
                        setNewConsultantId((currentId) => currentId === consultant.id ? '' : consultant.id);
                      }}
                      onToggleExpand={() => {
                        setExpandedConsultantId((currentId) => currentId === consultant.id ? null : consultant.id);
                      }}
                    />
                  ))
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AssignmentRole)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="analyst">Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Allocation — {newAllocation}% <span className="text-muted-foreground">({(newAllocation / 20).toFixed(1)}/5 days)</span></Label>
                  <Input type="range" min={0} max={100} step={10} value={newAllocation} onChange={(e) => setNewAllocation(Number(e.target.value))} className="h-8" />
                </div>
              </div>
              <Button size="sm" onClick={handleAddMember} disabled={!newConsultantId} className="w-full">Add to Team</Button>
            </div>
          )}

          {engAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">No consultants assigned yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Click &quot;+ Add Consultant&quot; to staff this project</p>
            </div>
          ) : (
            <div className="space-y-2">
              {engAssignments.map((assignment) => {
                const consultant = consultants.find((c) => c.id === assignment.consultant_id);
                if (!consultant) return null;
                const burnout = calculateBurnoutRisk(consultant.id, allAssignments, signals);
                const statusColor = getStatusColor(burnout);
                const currentUtilization = getCurrentConsultantUtilization(
                  consultant.id,
                  allAssignments
                );
                return (
                  <TeamMemberCard key={assignment.id} assignmentId={assignment.id}
                    consultantName={consultant.name} consultantRole={consultant.role} avatarUrl={consultant.avatar_url}
                    assignmentRole={assignment.role} allocation={assignment.allocation_percentage}
                    totalUtilization={currentUtilization} statusColor={statusColor} burnout={burnout}
                    skills={consultant.skills} engagementSkills={engagement.required_skills}
                    onUpdateAllocation={(id, pct) => onUpdateAssignment(id, { allocation_percentage: pct })}
                    onUpdateRole={(id, role) => onUpdateAssignment(id, { role })}
                    onRemove={onRemoveAssignment}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

function AvailableConsultantCard({
  consultant,
  engagement,
  allAssignments,
  allEngagements,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: {
  consultant: Consultant;
  engagement: Engagement;
  allAssignments: Assignment[];
  allEngagements: Engagement[];
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}) {
  const skillMatch = getConsultantMatches(consultant.skills, engagement.required_skills);
  const goalMatch = getConsultantMatches(consultant.goals, engagement.required_skills);

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
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">{consultant.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {SENIORITY_LABELS[consultant.seniority_level as keyof typeof SENIORITY_LABELS]}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {PRACTICE_AREA_LABELS[consultant.practice_area]}
            </span>
          </div>
          {engagement.required_skills.length > 0 && (
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
            engStart={engagement.start_date}
            engEnd={engagement.end_date}
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
          <ExpandedConsultantDetail
            consultant={consultant}
            engagement={engagement}
            allAssignments={allAssignments}
            allEngagements={allEngagements}
          />
        </div>
      )}
    </div>
  );
}

function ExpandedConsultantDetail({
  consultant,
  engagement,
  allAssignments,
  allEngagements,
}: {
  consultant: Consultant;
  engagement: Engagement;
  allAssignments: Assignment[];
  allEngagements: Engagement[];
}) {
  const periodStart = engagement.start_date;
  const periodEnd = engagement.end_date;

  const timelineWeeks = useMemo(
    () => getWeeklyAllocations(consultant.id, allAssignments, parseISO(periodStart), parseISO(periodEnd)),
    [consultant.id, allAssignments, periodStart, periodEnd]
  );

  const overlappingAssignments = useMemo(() => {
    return allAssignments
      .filter(
        (assignment) =>
          assignment.consultant_id === consultant.id &&
          assignment.engagement_id !== engagement.id &&
          datesOverlap(assignment.start_date, assignment.end_date, periodStart, periodEnd)
      )
      .map((assignment) => ({
        assignment,
        relatedEngagement:
          allEngagements.find((candidate) => candidate.id === assignment.engagement_id) ?? null,
      }))
      .sort((a, b) => a.assignment.start_date.localeCompare(b.assignment.start_date));
  }, [allAssignments, allEngagements, consultant.id, engagement.id, periodEnd, periodStart]);

  const averageAvailability = Math.round(
    getAverageAvailability(consultant.id, allAssignments, parseISO(periodStart), parseISO(periodEnd))
  );
  const peakLoad = timelineWeeks.reduce((max, week) => Math.max(max, week.allocation), 0);
  const busyWeeks = timelineWeeks.filter((week) => week.allocation > 0).length;

  const projectRequirements = engagement.required_skills.map((skill) => ({
    skill,
    hasSkill: hasNormalizedValue(consultant.skills, skill),
    hasGoal: hasNormalizedValue(consultant.goals, skill),
  }));

  const timelineColumns = `minmax(180px, 240px) repeat(${Math.max(timelineWeeks.length, 1)}, minmax(52px, 1fr))`;

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
          detail={`${format(parseISO(periodStart), 'MMM d')} - ${format(parseISO(periodEnd), 'MMM d')}`}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Project-Period Timeline
            </p>
            <p className="text-[11px] text-muted-foreground">
              Showing other commitments that overlap {engagement.project_name}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {timelineWeeks.length} week{timelineWeeks.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <div className="overflow-x-auto rounded-xl border bg-white">
          <div className="min-w-max">
            <div className="grid gap-px bg-slate-200" style={{ gridTemplateColumns: timelineColumns }}>
              <TimelineHeaderCell>Week of</TimelineHeaderCell>
              {timelineWeeks.map((week) => (
                <TimelineHeaderCell key={week.weekStart.toISOString()}>
                  {getWeekLabel(week.weekStart)}
                </TimelineHeaderCell>
              ))}

              <TimelineLabelCell
                title="Total load"
                subtitle={overlappingAssignments.length === 0 ? 'Open for the full project window' : 'Combined load across other work'}
              />
              {timelineWeeks.map((week) => (
                <TimelineLoadCell key={`total-${week.weekStart.toISOString()}`} allocation={week.allocation} />
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
            No other projects overlap this period, so this consultant is fully open throughout the engagement window.
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
              <ProjectRequirementPill key={skill} skill={skill} hasSkill={hasSkill} hasGoal={hasGoal} />
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
          requiredSkills={engagement.required_skills}
          tone="emerald"
          emptyMessage="No current skills listed"
        />
        <ConsultantFocusList
          title="Development Goals"
          items={consultant.goals}
          requiredSkills={engagement.required_skills}
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
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
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
  relatedEngagement: Engagement | null;
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
        {color && <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
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
          active ? 'text-slate-700' : 'border-dashed border-slate-200 bg-slate-50 text-slate-300'
        )}
        style={active ? { backgroundColor: withAlpha(color, 0.14), borderColor: withAlpha(color, 0.32) } : undefined}
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
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium', stateClass)}>
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
            {matches.length} match{matches.length === 1 ? '' : 'es'} for this project
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

// ─── Team Member Card ───────────────────────────────────────────────────────

function TeamMemberCard({ assignmentId, consultantName, consultantRole, avatarUrl, assignmentRole, allocation, totalUtilization, statusColor, burnout, skills, engagementSkills, onUpdateAllocation, onUpdateRole, onRemove }: {
  assignmentId: string; consultantName: string; consultantRole: string; avatarUrl: string;
  assignmentRole: AssignmentRole; allocation: number; totalUtilization: number; statusColor: string; burnout: number;
  skills: string[]; engagementSkills: string[];
  onUpdateAllocation: (id: string, pct: number) => Promise<void>;
  onUpdateRole: (id: string, role: AssignmentRole) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [editingAlloc, setEditingAlloc] = useState(false);
  const [localAlloc, setLocalAlloc] = useState(allocation);
  const matchedSkills = getConsultantMatches(skills, engagementSkills);

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt={consultantName} className="h-10 w-10 rounded-full bg-slate-100" />
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white" style={{ backgroundColor: statusColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{consultantName}</p>
          <p className="text-xs text-muted-foreground">{consultantRole}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onRemove(assignmentId)}>x</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Role</Label>
          <Select value={assignmentRole} onValueChange={(v) => onUpdateRole(assignmentId, v as AssignmentRole)}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="consultant">Consultant</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Allocation</Label>
          {editingAlloc ? (
            <Input type="number" min={0} max={200} value={localAlloc}
              onChange={(e) => setLocalAlloc(Number(e.target.value))}
              onBlur={async () => { setEditingAlloc(false); if (localAlloc !== allocation) await onUpdateAllocation(assignmentId, localAlloc); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="h-7 text-xs text-center" autoFocus />
          ) : (
            <button className="h-7 w-full rounded-md border text-xs font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
              onClick={() => { setLocalAlloc(allocation); setEditingAlloc(true); }}>
              {allocation}% <span className="text-muted-foreground">({formatAllocationAsManDays(allocation, 'compact')})</span>
            </button>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Current UR</Label>
          <div className={`h-7 rounded-md border flex items-center justify-center text-xs font-bold ${
            totalUtilization > 100 ? 'bg-red-50 text-red-700 border-red-200'
              : totalUtilization > 80 ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {totalUtilization}%
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {matchedSkills.length > 0 && <span className="text-[10px] text-green-600 font-medium">{matchedSkills.length}/{engagementSkills.length} skills match</span>}
        {burnout >= 60 && <Badge variant="secondary" className="text-[9px] bg-red-100 text-red-700">Burnout risk {Math.round(burnout)}</Badge>}
      </div>
    </div>
  );
}

function MatchIndicator({
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
  const palette = tone === 'emerald'
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
        active
          ? palette.badge
          : 'border-slate-200 bg-slate-50 text-slate-400'
      }`}
      title={active ? titleWhenActive : titleWhenInactive}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? palette.dot : 'bg-slate-300'}`} />
      <span>{label}</span>
      {active && <span>{count}</span>}
    </span>
  );
}

function getConsultantMatches(source: string[], requiredSkills: string[]) {
  if (source.length === 0 || requiredSkills.length === 0) return [];

  const required = new Set(requiredSkills.map(normalizeSkillName));
  return source.filter((item) => required.has(normalizeSkillName(item)));
}

function hasNormalizedValue(source: string[], candidate: string) {
  const normalizedCandidate = normalizeSkillName(candidate);
  return source.some((item) => normalizeSkillName(item) === normalizedCandidate);
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

// ─── Availability Bar ────────────────────────────────────────────────────────

function AvailabilityBar({
  consultantId,
  allAssignments,
  engStart,
  engEnd,
}: {
  consultantId: string;
  allAssignments: Assignment[];
  engStart: string;
  engEnd: string;
}) {
  const weeks = useMemo(() => {
    const start = parseISO(engStart);
    const end = parseISO(engEnd);
    return getWeeklyAllocations(consultantId, allAssignments, start, end);
  }, [consultantId, allAssignments, engStart, engEnd]);

  if (weeks.length === 0) return null;

  // Group consecutive weeks with same status to reduce DOM nodes
  type Segment = { status: 'free' | 'partial' | 'full'; span: number; available: number };
  const segments: Segment[] = [];
  for (const w of weeks) {
    const available = Math.max(0, 100 - w.allocation);
    const status = w.allocation >= 100 ? 'full' : w.allocation > 0 ? 'partial' : 'free';
    const last = segments[segments.length - 1];
    if (last && last.status === status && (status !== 'partial' || last.available === available)) {
      last.span++;
    } else {
      segments.push({ status, span: 1, available });
    }
  }

  const totalWeeks = weeks.length;

  return (
    <div className="flex h-[6px] w-full rounded-full overflow-hidden bg-slate-100 gap-px">
      {segments.map((seg, i) => {
        const widthPct = (seg.span / totalWeeks) * 100;
        const bg =
          seg.status === 'full'
            ? 'bg-red-400'
            : seg.status === 'partial'
              ? 'bg-amber-400'
              : 'bg-emerald-400';
        return (
          <div
            key={i}
            className={`relative ${bg} group`}
            style={{ width: `${widthPct}%` }}
            title={
              seg.status === 'full'
                ? 'Fully booked'
                : seg.status === 'partial'
                  ? `${seg.available}% available`
                  : 'Available'
            }
          >
            {seg.status === 'partial' && widthPct > 15 && (
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-amber-900 leading-none">
                {seg.available}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Attribute Card ─────────────────────────────────────────────────────────

function AttrCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ─── New Engagement Dialog ──────────────────────────────────────────────────

function NewEngagementDialog({ open, onOpenChange, onCreated, addEngagement }: {
  open: boolean; onOpenChange: (open: boolean) => void;
  onCreated: (eng: Engagement) => void;
  addEngagement: (data: Omit<Engagement, 'id'>) => Promise<Engagement>;
}) {
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState(format(now, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addWeeks(now, 8), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<EngagementStatus>('upcoming');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const eng = await addEngagement({
        client_name: clientName || 'New Client',
        project_name: projectName || 'New Project',
        start_date: startDate, end_date: endDate,
        status, color, required_skills: requiredSkills,
      });
      setClientName(''); setProjectName('');
      setStartDate(format(now, 'yyyy-MM-dd'));
      setEndDate(format(addWeeks(now, 8), 'yyyy-MM-dd'));
      setStatus('upcoming'); setColor(COLOR_PALETTE[0]);
      setRequiredSkills([]);
      onCreated(eng);
    } catch (e) { console.error('Failed to create engagement:', e); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a new client engagement. No fields are required — fill them in later.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Client Name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Project Name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Digital Transformation" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EngagementStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_STATUS_OPTIONS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-1.5 flex-wrap pt-1">
                {COLOR_PALETTE.map((c) => (
                  <button key={c} className={`w-6 h-6 rounded-md border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Required Skills</Label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto border rounded-md p-3">
              {ALL_SKILLS.map((skill) => (
                <Badge key={skill} variant={requiredSkills.includes(skill) ? 'default' : 'outline'} className="cursor-pointer transition-colors text-xs"
                  onClick={() => setRequiredSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])}>
                  {requiredSkills.includes(skill) ? skill + ' x' : '+ ' + skill}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} disabled={saving} className="flex-1">{saving ? 'Creating...' : 'Create Project'}</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
