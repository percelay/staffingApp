'use client';

import { useState } from 'react';
import { format, addWeeks, startOfWeek } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import type { EngagementStatus } from '@/lib/types/engagement';

const ALL_SKILLS = [
  'Financial Modeling', 'Change Management', 'Data Analytics', 'Due Diligence',
  'Process Optimization', 'Digital Strategy', 'Stakeholder Management', 'Market Analysis',
  'Risk Assessment', 'Supply Chain', 'M&A Integration', 'Cost Reduction',
  'Agile Transformation', 'Cloud Migration', 'People Analytics', 'Regulatory Compliance',
  'Revenue Growth', 'Customer Experience', 'Organizational Design', 'Performance Management',
];

const COLOR_OPTIONS = [
  '#4F46E5', '#0891B2', '#059669', '#D97706',
  '#DC2626', '#7C3AED', '#DB2777', '#2563EB',
  '#EA580C', '#65A30D',
];

interface EngagementAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementAddDialog({ open, onOpenChange }: EngagementAddDialogProps) {
  const addEngagement = useEngagementStore((s) => s.addEngagement);

  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState(format(now, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addWeeks(now, 8), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<EngagementStatus>('upcoming');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientName.trim() || !projectName.trim()) return;
    setSaving(true);
    try {
      await addEngagement({
        client_name: clientName.trim(),
        project_name: projectName.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
        color,
        required_skills: requiredSkills,
      });
      // Reset
      setClientName('');
      setProjectName('');
      setStartDate(format(now, 'yyyy-MM-dd'));
      setEndDate(format(addWeeks(now, 8), 'yyyy-MM-dd'));
      setStatus('upcoming');
      setColor(COLOR_OPTIONS[0]);
      setRequiredSkills([]);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to add engagement:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Engagement</DialogTitle>
          <DialogDescription>
            Create a new client project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Digital Transformation" />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EngagementStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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

          <div className="space-y-2">
            <Label>Required Skills ({requiredSkills.length})</Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border rounded-md p-3">
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

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving || !clientName.trim() || !projectName.trim()}
              className="flex-1"
            >
              {saving ? 'Creating...' : 'Create Engagement'}
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
