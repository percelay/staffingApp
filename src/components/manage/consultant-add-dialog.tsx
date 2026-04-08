'use client';

import { useState } from 'react';
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
import { CONSULTING_SKILLS } from '@/lib/constants/staffing';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import {
  SENIORITY_LABELS,
  PRACTICE_AREA_LABELS,
  type SeniorityLevel,
  type PracticeArea,
} from '@/lib/types/consultant';

interface ConsultantAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConsultantAddDialog({ open, onOpenChange }: ConsultantAddDialogProps) {
  const addConsultant = useConsultantStore((s) => s.addConsultant);
  const [name, setName] = useState('');
  const [seniority, setSeniority] = useState<SeniorityLevel>('consultant');
  const [practiceArea, setPracticeArea] = useState<PracticeArea>('strategy');
  const [skills, setSkills] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addConsultant({
        name: name.trim(),
        role: SENIORITY_LABELS[seniority],
        seniority_level: seniority,
        practice_area: practiceArea,
        skills,
        goals,
        status: 'active',
        avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name.trim())}`,
      });
      // Reset form
      setName('');
      setSeniority('consultant');
      setPracticeArea('strategy');
      setSkills([]);
      setGoals([]);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to add consultant:', e);
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    // Remove from goals if added as a skill
    setGoals((prev) => prev.filter((g) => g !== skill));
  };

  const toggleGoal = (skill: string) => {
    setGoals((prev) =>
      prev.includes(skill) ? prev.filter((g) => g !== skill) : [...prev, skill]
    );
  };

  const availableGoalSkills = CONSULTING_SKILLS.filter((s) => !skills.includes(s));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Consultant</DialogTitle>
          <DialogDescription>
            Add a consultant to the staffing pool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seniority</Label>
              <Select value={seniority} onValueChange={(v) => setSeniority(v as SeniorityLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SENIORITY_LABELS) as [SeniorityLevel, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Practice Area</Label>
              <Select value={practiceArea} onValueChange={(v) => setPracticeArea(v as PracticeArea)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(PRACTICE_AREA_LABELS) as [PracticeArea, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skills ({skills.length} selected)</Label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto border rounded-md p-3">
              {CONSULTING_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={skills.includes(skill) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleSkill(skill)}
                >
                  {skills.includes(skill) ? skill + ' x' : '+ ' + skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Development Goals ({goals.length} selected)</Label>
            <p className="text-xs text-muted-foreground">
              Skills this consultant wants to learn.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto border rounded-md p-3">
              {availableGoalSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant={goals.includes(skill) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${goals.includes(skill) ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                  onClick={() => toggleGoal(skill)}
                >
                  {goals.includes(skill) ? skill + ' x' : '+ ' + skill}
                </Badge>
              ))}
              {availableGoalSkills.length === 0 && (
                <p className="text-sm text-muted-foreground italic">All skills already assigned</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1">
              {saving ? 'Adding...' : 'Add Consultant'}
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
