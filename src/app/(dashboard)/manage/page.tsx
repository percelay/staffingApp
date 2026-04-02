'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useEngagementStore } from '@/lib/stores/engagement-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import { getCurrentConsultantUtilization, isAssignmentActiveOnDate } from '@/lib/utils/allocation';
import { calculateBurnoutRisk } from '@/lib/utils/burnout';
import { getStatusColor } from '@/lib/utils/colors';
import { SENIORITY_LABELS, PRACTICE_AREA_LABELS } from '@/lib/types/consultant';
import type { PracticeArea, SeniorityLevel } from '@/lib/types/consultant';
import {
  ENGAGEMENT_STATUS_DOT_CLASSES,
  ENGAGEMENT_STATUS_LABELS,
  ENGAGEMENT_STATUS_OPTIONS,
  type EngagementStatus,
} from '@/lib/types/engagement';
import { ConsultantEditSheet } from '@/components/manage/consultant-edit-sheet';
import { ConsultantAddDialog } from '@/components/manage/consultant-add-dialog';
import { EngagementEditSheet } from '@/components/manage/engagement-edit-sheet';
import { EngagementAddDialog } from '@/components/manage/engagement-add-dialog';

type Tab = 'people' | 'engagements';

export default function ManagePage() {
  const consultants = useConsultantStore((s) => s.consultants);
  const engagements = useEngagementStore((s) => s.engagements);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);
  const [tab, setTab] = useState<Tab>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [practiceFilter, setPracticeFilter] = useState<PracticeArea | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EngagementStatus | 'all'>('all');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>(null);
  const [showAddConsultant, setShowAddConsultant] = useState(false);
  const [showAddEngagement, setShowAddEngagement] = useState(false);

  const selectedConsultant = selectedConsultantId
    ? consultants.find((c) => c.id === selectedConsultantId) ?? null
    : null;

  const selectedEngagement = selectedEngagementId
    ? engagements.find((e) => e.id === selectedEngagementId) ?? null
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

    const now = new Date();

    return list.map((c) => {
      const burnout = calculateBurnoutRisk(c.id, assignments, signals);
      const currentUtilization = getCurrentConsultantUtilization(
        c.id,
        assignments,
        now
      );
      const assignmentCount = assignments.filter(
        (a) => a.consultant_id === c.id && isAssignmentActiveOnDate(a, now)
      ).length;

      return { consultant: c, burnout, currentUtilization, assignmentCount };
    }).sort((a, b) => {
      const seniorityOrder: Record<string, number> = { partner: 5, senior_manager: 4, manager: 3, consultant: 2, analyst: 1 };
      return (seniorityOrder[b.consultant.seniority_level] ?? 0) - (seniorityOrder[a.consultant.seniority_level] ?? 0);
    });
  }, [consultants, practiceFilter, searchQuery, assignments, signals]);

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
    return list.sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [engagements, statusFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {tab === 'people' ? 'People' : 'Engagements'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tab === 'people'
                ? `${consultants.length} consultants`
                : `${engagements.length} engagements`}
            </p>
          </div>
          <Button onClick={() => tab === 'people' ? setShowAddConsultant(true) : setShowAddEngagement(true)}>
            {tab === 'people' ? '+ Add Consultant' : '+ Add Engagement'}
          </Button>
        </div>

        {/* Tabs + Filters */}
        <div className="flex gap-3 items-center">
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              className={`px-3 py-1.5 transition-colors ${tab === 'people' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => { setTab('people'); setSearchQuery(''); }}
            >
              People
            </button>
            <button
              className={`px-3 py-1.5 transition-colors ${tab === 'engagements' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              onClick={() => { setTab('engagements'); setSearchQuery(''); }}
            >
              Engagements
            </button>
          </div>
          <Input
            placeholder={tab === 'people' ? 'Search by name or skill...' : 'Search by client or project...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm max-w-xs"
          />
          {tab === 'people' ? (
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
          ) : (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EngagementStatus | 'all')}>
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ENGAGEMENT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          <div className="grid gap-2">
            {tab === 'people' ? (
              <>
                {enrichedConsultants.map(({ consultant, burnout, currentUtilization, assignmentCount }) => {
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
                            {assignmentCount} current project{assignmentCount !== 1 ? 's' : ''}
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
                            currentUtilization > 100
                              ? 'text-red-500'
                              : currentUtilization > 80
                              ? 'text-amber-500'
                              : 'text-green-500'
                          }`}>
                            {currentUtilization}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">Current UR</p>
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
              </>
            ) : (
              <>
                {filteredEngagements.map((engagement) => {
                  const teamCount = assignments.filter((a) => a.engagement_id === engagement.id).length;
                  return (
                    <button
                      key={engagement.id}
                      onClick={() => setSelectedEngagementId(engagement.id)}
                      className="w-full text-left p-4 rounded-lg border bg-white hover:border-primary/30 hover:shadow-sm transition-all flex items-center gap-4"
                    >
                      <div
                        className="w-2 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: engagement.color }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{engagement.client_name}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${ENGAGEMENT_STATUS_DOT_CLASSES[engagement.status]}`} />
                            {ENGAGEMENT_STATUS_LABELS[engagement.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {engagement.project_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {engagement.start_date} — {engagement.end_date}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {teamCount} member{teamCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {engagement.required_skills.length} skill{engagement.required_skills.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {filteredEngagements.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <p className="text-sm">No engagements found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Consultant Sheets/Dialogs */}
      <ConsultantEditSheet
        consultant={selectedConsultant}
        open={!!selectedConsultant}
        onOpenChange={(open) => { if (!open) setSelectedConsultantId(null); }}
      />
      <ConsultantAddDialog open={showAddConsultant} onOpenChange={setShowAddConsultant} />

      {/* Engagement Sheets/Dialogs */}
      <EngagementEditSheet
        engagement={selectedEngagement}
        open={!!selectedEngagement}
        onOpenChange={(open) => { if (!open) setSelectedEngagementId(null); }}
      />
      <EngagementAddDialog open={showAddEngagement} onOpenChange={setShowAddEngagement} />
    </div>
  );
}
