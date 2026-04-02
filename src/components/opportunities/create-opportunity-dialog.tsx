'use client';

import { useState, useTransition } from 'react';
import { addWeeks, format, startOfWeek } from 'date-fns';
import { createOpportunityAndRedirect } from '@/app/(dashboard)/opportunities/actions';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import {
  PIPELINE_STAGE_LABELS,
  ACTIVE_PIPELINE_STAGES,
  type PipelineStage,
  type Opportunity,
} from '@/lib/types/opportunity';

const ALL_SKILLS = [
  'Financial Modeling', 'Change Management', 'Data Analytics', 'Due Diligence',
  'Process Optimization', 'Digital Strategy', 'Stakeholder Management', 'Market Analysis',
  'Risk Assessment', 'Supply Chain', 'M&A Integration', 'Cost Reduction',
  'Agile Transformation', 'Cloud Migration', 'People Analytics', 'Regulatory Compliance',
  'Revenue Growth', 'Customer Experience', 'Organizational Design', 'Performance Management',
];

const COLOR_PALETTE = [
  '#6366F1', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#2563EB',
  '#EA580C', '#65A30D',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, pre-fills the form for editing */
  editingOpportunity?: Opportunity;
  /** If provided, called after creating (instead of redirecting to detail page) */
  onCreated?: (opportunity: Opportunity) => void;
  /** If provided, overrides the default stage for new opportunities */
  defaultStage?: PipelineStage;
}

export function CreateOpportunityDialog({
  open,
  onOpenChange,
  editingOpportunity,
  onCreated,
  defaultStage,
}: Props) {
  const addOpportunity = useOpportunityStore((s) => s.addOpportunity);
  const updateOpportunity = useOpportunityStore((s) => s.updateOpportunity);
  const isEditing = Boolean(editingOpportunity);
  const [isCreating, startCreateTransition] = useTransition();

  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const [clientName, setClientName] = useState(editingOpportunity?.client_name ?? '');
  const [projectName, setProjectName] = useState(editingOpportunity?.project_name ?? '');
  const [startDate, setStartDate] = useState(editingOpportunity?.start_date ?? format(addWeeks(now, 2), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(editingOpportunity?.end_date ?? format(addWeeks(now, 10), 'yyyy-MM-dd'));
  const [stage, setStage] = useState<PipelineStage>(editingOpportunity?.stage ?? defaultStage ?? 'identified');
  const [probability, setProbability] = useState(editingOpportunity?.probability ?? 25);
  const [estimatedValue, setEstimatedValue] = useState(editingOpportunity?.estimated_value?.toString() ?? '');
  const [color, setColor] = useState(editingOpportunity?.color ?? COLOR_PALETTE[0]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(editingOpportunity?.required_skills ?? []);
  const [isBet, setIsBet] = useState(editingOpportunity?.is_bet ?? false);
  const [notes, setNotes] = useState(editingOpportunity?.notes ?? '');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSubmit = async () => {
    const data = {
      client_name: clientName || 'New Client',
      project_name: projectName || 'New Opportunity',
      start_date: startDate,
      end_date: endDate,
      stage,
      probability,
      estimated_value: estimatedValue ? Number(estimatedValue) : null,
      color,
      is_bet: isBet,
      required_skills: requiredSkills,
      notes: notes || null,
      converted_engagement_id: null,
    };

    if (isEditing && editingOpportunity) {
      setSavingEdit(true);
      try {
        await updateOpportunity(editingOpportunity.id, data);
        onOpenChange(false);
        resetForm();
      } catch (e) {
        console.error('Failed to save opportunity:', e);
      } finally {
        setSavingEdit(false);
      }
      return;
    }

    if (onCreated) {
      setSavingEdit(true);
      try {
        const created = await addOpportunity(data as Omit<Opportunity, 'id'>);
        onOpenChange(false);
        resetForm();
        onCreated(created);
      } catch (e) {
        console.error('Failed to create opportunity:', e);
      } finally {
        setSavingEdit(false);
      }
    } else {
      startCreateTransition(async () => {
        await createOpportunityAndRedirect(data);
      });
    }
  };

  const resetForm = () => {
    setClientName('');
    setProjectName('');
    setStartDate(format(addWeeks(now, 2), 'yyyy-MM-dd'));
    setEndDate(format(addWeeks(now, 10), 'yyyy-MM-dd'));
    setStage('identified');
    setProbability(25);
    setEstimatedValue('');
    setColor(COLOR_PALETTE[0]);
    setIsBet(false);
    setRequiredSkills([]);
    setNotes('');
  };

  const isSaving = savingEdit || isCreating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Opportunity' : 'New Opportunity'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update opportunity details.'
              : 'Add a potential engagement to the pipeline.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Client Name</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Project Name</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. M&A Due Diligence"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Expected Start</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Expected End</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Pipeline Stage</Label>
              <Select
                value={stage}
                onValueChange={(v) => setStage(v as PipelineStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PIPELINE_STAGE_LABELS[s]}
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
                onChange={(e) => setProbability(Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Estimated Value ($)</Label>
              <Input
                type="number"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <div className="flex gap-1.5 flex-wrap pt-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-md border-2 transition-all ${
                    color === c
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-xs">Bet</Label>
              <p className="text-xs text-muted-foreground">Mark this opportunity as a strategic bet</p>
            </div>
            <Switch checked={isBet} onCheckedChange={setIsBet} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Required Skills</Label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto border rounded-md p-3">
              {ALL_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={requiredSkills.includes(skill) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors text-xs"
                  onClick={() =>
                    setRequiredSkills((prev) =>
                      prev.includes(skill)
                        ? prev.filter((s) => s !== skill)
                        : [...prev, skill]
                    )
                  }
                >
                  {requiredSkills.includes(skill) ? skill + ' x' : '+ ' + skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving
                ? 'Saving...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Opportunity'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
