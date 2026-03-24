'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { getWeeklyAllocations } from '@/lib/utils/availability';
import { get12WeekWindow } from '@/lib/utils/date-helpers';
import {
  SENIORITY_LABELS,
  PRACTICE_AREA_LABELS,
  type Consultant,
  type SeniorityLevel,
  type PracticeArea,
} from '@/lib/types/consultant';

const ALL_SKILLS = [
  'Financial Modeling', 'Change Management', 'Data Analytics', 'Due Diligence',
  'Process Optimization', 'Digital Strategy', 'Stakeholder Management', 'Market Analysis',
  'Risk Assessment', 'Supply Chain', 'M&A Integration', 'Cost Reduction',
  'Agile Transformation', 'Cloud Migration', 'People Analytics', 'Regulatory Compliance',
  'Revenue Growth', 'Customer Experience', 'Organizational Design', 'Performance Management',
];

function seniorityToRole(seniority: SeniorityLevel): string {
  return SENIORITY_LABELS[seniority] || 'Consultant';
}

interface ConsultantEditSheetProps {
  consultant: Consultant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultantEditSheet({ consultant, open, onOpenChange }: ConsultantEditSheetProps) {
  const updateConsultant = useConsultantStore((s) => s.updateConsultant);
  const updateSkills = useConsultantStore((s) => s.updateSkills);
  const removeConsultant = useConsultantStore((s) => s.removeConsultant);
  const assignments = useAssignmentStore((s) => s.assignments);
  const engagements = useEngagementStore((s) => s.engagements);

  const [name, setName] = useState('');
  const [seniority, setSeniority] = useState<SeniorityLevel>('consultant');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('strategy');
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (consultant) {
      setName(consultant.name);
      setSeniority(consultant.seniority_level);
      setPracticeArea(consultant.practice_area);
      setSkills([...consultant.skills]);
      setConfirmDelete(false);
    }
  }, [consultant]);

  if (!consultant) return null;

  // Compute utilization
  const consultantAssignments = assignments.filter((a) => a.consultant_id === consultant.id);
  const { start, end } = get12WeekWindow(0);
  const weeklyAllocs = getWeeklyAllocations(consultant.id, assignments, start, end);
  const avgUtilization =
    weeklyAllocs.length > 0
      ? Math.round(weeklyAllocs.reduce((sum, w) => sum + w.allocation, 0) / weeklyAllocs.length)
      : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update consultant fields
      if (
        name !== consultant.name ||
        seniority !== consultant.seniority_level ||
        practiceArea !== consultant.practice_area
      ) {
        await updateConsultant(consultant.id, {
          name,
          seniority_level: seniority,
          practice_area: practiceArea,
          role: seniorityToRole(seniority),
        });
      }
      // Update skills if changed
      const skillsChanged =
        skills.length !== consultant.skills.length ||
        skills.some((s) => !consultant.skills.includes(s));
      if (skillsChanged) {
        await updateSkills(consultant.id, skills);
      }
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to save consultant:', e);
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
      await removeConsultant(consultant.id);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to remove consultant:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const availableSkills = ALL_SKILLS.filter((s) => !skills.includes(s));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Consultant</SheetTitle>
          <SheetDescription>
            Update consultant details, seniority, and skills.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Utilization Banner */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Utilization</span>
              <span
                className={`text-2xl font-bold ${
                  avgUtilization > 100
                    ? 'text-red-500'
                    : avgUtilization > 80
                    ? 'text-amber-500'
                    : 'text-green-500'
                }`}
              >
                {avgUtilization}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {consultantAssignments.length} active assignment{consultantAssignments.length !== 1 ? 's' : ''} (12-week avg)
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Seniority */}
          <div className="space-y-2">
            <Label>Seniority Level</Label>
            <Select value={seniority} onValueChange={(v) => setSeniority(v as SeniorityLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SENIORITY_LABELS) as [SeniorityLevel, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Practice Area */}
          <div className="space-y-2">
            <Label>Practice Area</Label>
            <Select value={practiceArea} onValueChange={(v) => setPracticeArea(v as PracticeArea)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PRACTICE_AREA_LABELS) as [PracticeArea, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Skills */}
          <div className="space-y-3">
            <Label>Skills ({skills.length})</Label>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="default"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill} x
                </Badge>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No skills assigned</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Click to add:</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {availableSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => toggleSkill(skill)}
                  >
                    + {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Active Assignments */}
          <div className="space-y-3">
            <Label>Active Assignments</Label>
            {consultantAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Not assigned to any projects</p>
            ) : (
              <div className="space-y-2">
                {consultantAssignments.map((assignment) => {
                  const eng = engagements.find((e) => e.id === assignment.engagement_id);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: eng?.color || '#888' }}
                        />
                        <div>
                          <p className="text-sm font-medium">{eng?.client_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{eng?.project_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {assignment.allocation_percentage}%
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {assignment.role}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant={confirmDelete ? 'destructive' : 'outline'}
              onClick={handleDelete}
              disabled={saving}
            >
              {confirmDelete ? 'Confirm Delete' : 'Remove'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
