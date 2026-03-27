'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import type { Engagement, EngagementStatus } from '@/lib/types/engagement';
import type { AssignmentRole } from '@/lib/types/assignment';

const ALL_SKILLS = [
  'Financial Modeling', 'Change Management', 'Data Analytics', 'Due Diligence',
  'Process Optimization', 'Digital Strategy', 'Stakeholder Management', 'Market Analysis',
  'Risk Assessment', 'Supply Chain', 'M&A Integration', 'Cost Reduction',
  'Agile Transformation', 'Cloud Migration', 'People Analytics', 'Regulatory Compliance',
  'Revenue Growth', 'Customer Experience', 'Organizational Design', 'Performance Management',
];

const STATUS_OPTIONS: { value: EngagementStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-400' },
  { value: 'at_risk', label: 'At Risk', color: 'bg-red-500' },
];

const COLOR_OPTIONS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#2563EB',
  '#EA580C', '#65A30D',
];

interface EngagementEditSheetProps {
  engagement: Engagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementEditSheet({ engagement, open, onOpenChange }: EngagementEditSheetProps) {
  const updateEngagement = useEngagementStore((s) => s.updateEngagement);
  const removeEngagement = useEngagementStore((s) => s.removeEngagement);
  const assignments = useAssignmentStore((s) => s.assignments);
  const consultants = useConsultantStore((s) => s.consultants);
  const createAssignment = useAssignmentStore((s) => s.createAssignment);
  const updateAssignment = useAssignmentStore((s) => s.updateAssignment);
  const removeAssignment = useAssignmentStore((s) => s.removeAssignment);

  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<EngagementStatus>('active');
  const [color, setColor] = useState('#4F46E5');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Assignment editor state
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [newConsultantId, setNewConsultantId] = useState('');
  const [newRole, setNewRole] = useState<AssignmentRole>('consultant');
  const [newAllocation, setNewAllocation] = useState(100);

  useEffect(() => {
    if (engagement) {
      setClientName(engagement.client_name);
      setProjectName(engagement.project_name);
      setStartDate(engagement.start_date);
      setEndDate(engagement.end_date);
      setStatus(engagement.status);
      setColor(engagement.color);
      setRequiredSkills([...engagement.required_skills]);
      setConfirmDelete(false);
      setAddingAssignment(false);
    }
  }, [engagement]);

  if (!engagement) return null;

  const engAssignments = assignments.filter((a) => a.engagement_id === engagement.id);
  const assignedConsultantIds = new Set(engAssignments.map((a) => a.consultant_id));
  const availableConsultants = consultants.filter((c) => !assignedConsultantIds.has(c.id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEngagement(engagement.id, {
        client_name: clientName,
        project_name: projectName,
        start_date: startDate,
        end_date: endDate,
        status,
        color,
        required_skills: requiredSkills,
      });
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to save engagement:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await removeEngagement(engagement.id);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to delete engagement:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddAssignment = async () => {
    if (!newConsultantId) return;
    try {
      await createAssignment({
        consultant_id: newConsultantId,
        engagement_id: engagement.id,
        role: newRole,
        start_date: startDate,
        end_date: endDate,
        allocation_percentage: newAllocation,
      });
      setAddingAssignment(false);
      setNewConsultantId('');
      setNewRole('consultant');
      setNewAllocation(100);
    } catch (e) {
      console.error('Failed to add assignment:', e);
    }
  };

  const handleUpdateAllocation = async (assignmentId: string, newPct: number) => {
    await updateAssignment(assignmentId, { allocation_percentage: newPct });
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    await removeAssignment(assignmentId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Engagement</SheetTitle>
          <SheetDescription>
            Update project details, timelines, team, and allocation percentages.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-6">
          {/* Client & Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Status & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EngagementStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-1.5 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-md border-2 transition-all ${
                      color === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Required Skills */}
          <div className="space-y-2">
            <Label>Required Skills ({requiredSkills.length})</Label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {ALL_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={requiredSkills.includes(skill) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors text-xs"
                  onClick={() => toggleSkill(skill)}
                >
                  {requiredSkills.includes(skill) ? skill + ' x' : '+ ' + skill}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Team / Assignments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Team ({engAssignments.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingAssignment(!addingAssignment)}
              >
                {addingAssignment ? 'Cancel' : '+ Add Member'}
              </Button>
            </div>

            {/* Add Assignment Form */}
            {addingAssignment && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Consultant</Label>
                  <Select value={newConsultantId} onValueChange={(v) => setNewConsultantId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select consultant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableConsultants.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Role</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as AssignmentRole)}>
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label className="text-xs">Allocation %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newAllocation}
                      onChange={(e) => setNewAllocation(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddAssignment}
                  disabled={!newConsultantId}
                  className="w-full"
                >
                  Add to Team
                </Button>
              </div>
            )}

            {/* Existing Assignments */}
            {engAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No team members assigned</p>
            ) : (
              <div className="space-y-2">
                {engAssignments.map((assignment) => {
                  const consultant = consultants.find((c) => c.id === assignment.consultant_id);
                  return (
                    <AssignmentRow
                      key={assignment.id}
                      assignmentId={assignment.id}
                      consultantName={consultant?.name || 'Unknown'}
                      consultantRole={consultant?.role || ''}
                      assignmentRole={assignment.role}
                      allocation={assignment.allocation_percentage}
                      onUpdateAllocation={handleUpdateAllocation}
                      onRemove={handleRemoveAssignment}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !clientName.trim() || !projectName.trim()}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant={confirmDelete ? 'destructive' : 'outline'}
              onClick={handleDelete}
              disabled={saving}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Inline assignment row with editable allocation
function AssignmentRow({
  assignmentId,
  consultantName,
  consultantRole,
  assignmentRole,
  allocation,
  onUpdateAllocation,
  onRemove,
}: {
  assignmentId: string;
  consultantName: string;
  consultantRole: string;
  assignmentRole: string;
  allocation: number;
  onUpdateAllocation: (id: string, pct: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [editingAllocation, setEditingAllocation] = useState(false);
  const [localAllocation, setLocalAllocation] = useState(allocation);

  const handleBlur = async () => {
    setEditingAllocation(false);
    if (localAllocation !== allocation) {
      await onUpdateAllocation(assignmentId, localAllocation);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{consultantName}</p>
        <p className="text-xs text-muted-foreground">
          {consultantRole} / <span className="capitalize">{assignmentRole}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        {editingAllocation ? (
          <Input
            type="number"
            min={0}
            max={200}
            value={localAllocation}
            onChange={(e) => setLocalAllocation(Number(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            className="w-16 h-8 text-center text-sm"
            autoFocus
          />
        ) : (
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => setEditingAllocation(true)}
          >
            {allocation}%
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(assignmentId)}
        >
          x
        </Button>
      </div>
    </div>
  );
}
