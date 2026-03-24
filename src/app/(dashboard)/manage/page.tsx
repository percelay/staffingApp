'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getWeeklyAllocations } from '@/lib/utils/availability';
import { getStatusColor } from '@/lib/utils/colors';
import { get12WeekWindow } from '@/lib/utils/date-helpers';
import { SENIORITY_LABELS, PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import type { PracticeArea, SeniorityLevel } from '@/lib/types/consultant';
import { ConsultantEditSheet } from '@/components/manage/consultant-edit-sheet';
import { ConsultantAddDialog } from '@/components/manage/consultant-add-dialog';

export default function ManagePage() {
  const consultants = useConsultantStore((s) => s.consultants);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  const [searchQuery, setSearchQuery] = useState('');
  const [practiceFilter, setPracticeFilter] = useState<PracticeArea | 'all'>('all');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const selectedConsultant = selectedConsultantId
    ? consultants.find((c) => c.id === selectedConsultantId) ?? null
    : null;

  const enrichedConsultants = useMemo(() => {
    let list = [...consultants];
    if (practiceFilter !== 'all') {
      list = list.filter((c) => c.practice_area === practiceFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    const { start, end } = get12WeekWindow(0);

    return list.map((c) => {
      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      const weeklyAllocs = getWeeklyAllocations(c.id, assignments, start, end);
      const avgUtil =
        weeklyAllocs.length > 0
          ? Math.round(
              weeklyAllocs.reduce((sum, w) => sum + w.allocation, 0) / weeklyAllocs.length
            )
          : 0;
      const assignmentCount = assignments.filter((a) => a.consultant_id === c.id).length;
      return { consultant: c, burnout, avgUtil, assignmentCount };
    }).sort((a, b) => {
      const seniorityOrder: Record<string, number> = { partner: 5, senior_manager: 4, manager: 3, consultant: 2, analyst: 1 };
      return (seniorityOrder[b.consultant.seniority_level] ?? 0) - (seniorityOrder[a.consultant.seniority_level] ?? 0);
    });
  }, [consultants, practiceFilter, searchQuery, assignments, signals]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">People</h1>
            <p className="text-sm text-muted-foreground">{consultants.length} consultants</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>+ Add Consultant</Button>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Search by name or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm max-w-xs"
          />
          <Select value={practiceFilter} onValueChange={(v) => setPracticeFilter(v as PracticeArea | 'all')}>
            <SelectTrigger className="h-8 text-xs w-[180px]">
              <SelectValue placeholder="All Practice Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Practice Areas</SelectItem>
              {Object.entries(PRACTICE_AREA_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid gap-2">
            {enrichedConsultants.map(({ consultant, burnout, avgUtil, assignmentCount }) => {
              const statusColor = getStatusColor(burnout);
              return (
                <button
                  key={consultant.id}
                  onClick={() => setSelectedConsultantId(consultant.id)}
                  className="w-full text-left p-4 rounded-lg border bg-white hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-4"
                >
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={consultant.avatar_url} alt={consultant.name} className="h-10 w-10 rounded-full bg-slate-100" />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white" style={{ backgroundColor: statusColor }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{consultant.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {SENIORITY_LABELS[consultant.seniority_level as SeniorityLevel]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {consultant.practice_area}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {consultant.skills.length} skills
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {assignmentCount} project{assignmentCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {consultant.skills.slice(0, 3).join(', ')}
                        {consultant.skills.length > 3 ? ` +${consultant.skills.length - 3}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        avgUtil > 100 ? 'text-red-500' : avgUtil > 80 ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        {avgUtil}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Utilization</p>
                    </div>
                  </div>
                </button>
              );
            })}

            {enrichedConsultants.length === 0 && (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <p className="text-sm">No consultants found</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Edit Sheet */}
      <ConsultantEditSheet
        consultant={selectedConsultant}
        open={!!selectedConsultant}
        onOpenChange={(open) => { if (!open) setSelectedConsultantId(null); }}
      />

      {/* Add Dialog */}
      <ConsultantAddDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
