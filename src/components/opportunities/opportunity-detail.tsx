'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import { useOpportunityUIStore } from '@/lib/stores/opportunity-ui-store';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import { useAssignmentStore } from '@/lib/stores/assignment-store';
import { useWellbeingStore } from '@/lib/stores/wellbeing-store';
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_BADGE_CLASSES,
} from '@/lib/types/opportunity';
import { getCapacityConflicts } from '@/lib/utils/impact';
import { formatIsoDate, getWeekCount } from '@/lib/utils/date-helpers';
import { ScenarioEditor } from './scenario-editor';
import { ScenarioComparison } from './scenario-comparison';
import { CreateOpportunityDialog } from './create-opportunity-dialog';

interface Props {
  opportunityId: string;
  embedded?: boolean;
  onDeleted?: () => void;
}

export function OpportunityDetail({
  opportunityId,
  embedded = false,
  onDeleted,
}: Props) {
  const router = useRouter();
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const allScenarios = useOpportunityStore((s) => s.scenarios);
  const activeScenarioId = useOpportunityUIStore((s) => s.activeScenarioId);
  const setActiveScenarioId = useOpportunityUIStore(
    (s) => s.setActiveScenarioId
  );
  const addScenario = useOpportunityStore((s) => s.addScenario);
  const removeOpportunity = useOpportunityStore((s) => s.removeOpportunity);
  const consultants = useConsultantStore((s) => s.consultants);
  const assignments = useAssignmentStore((s) => s.assignments);
  const signals = useWellbeingStore((s) => s.signals);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  const opportunity = useMemo(
    () => opportunities.find((candidate) => candidate.id === opportunityId),
    [opportunities, opportunityId]
  );
  const scenarios = useMemo(
    () =>
      allScenarios.filter((scenario) => scenario.opportunity_id === opportunityId),
    [allScenarios, opportunityId]
  );

  // Auto-select first scenario
  useEffect(() => {
    if (
      scenarios.length > 0 &&
      (!activeScenarioId || !scenarios.some((scenario) => scenario.id === activeScenarioId))
    ) {
      const defaultScenario =
        scenarios.find((s) => s.is_default) || scenarios[0];
      setActiveScenarioId(defaultScenario.id);
    }
  }, [scenarios, activeScenarioId, setActiveScenarioId]);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  const conflicts = useMemo(() => {
    if (!activeScenario) return [];
    return getCapacityConflicts(activeScenario, assignments);
  }, [activeScenario, assignments]);

  if (!opportunity) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Opportunity not found
          </p>
          <Button className="mt-4" onClick={() => router.push('/opportunities')}>
            Back to Pipeline
          </Button>
        </div>
      </div>
    );
  }

  const weeks = getWeekCount(opportunity.start_date, opportunity.end_date);

  const handleAddScenario = async () => {
    if (!newScenarioName.trim()) return;
    const created = await addScenario(opportunityId, {
      name: newScenarioName.trim(),
    });
    setNewScenarioName('');
    setActiveScenarioId(created.id);
  };

  const handleDelete = async () => {
    await removeOpportunity(opportunityId);
    if (embedded) {
      onDeleted?.();
      return;
    }
    router.push('/opportunities');
  };

  const scenarioDetailContent = activeScenario ? (
    <div className="p-6 space-y-6">
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800">
            {conflicts.length} capacity{' '}
            {conflicts.length === 1 ? 'conflict' : 'conflicts'} detected
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Some consultants would be overallocated if this
            opportunity wins with this team.
          </p>
        </div>
      )}

      <ScenarioEditor
        scenario={activeScenario}
        opportunity={opportunity}
        consultants={consultants}
        assignments={assignments}
        signals={signals}
      />

      {scenarios.length > 1 && (
        <>
          <Separator />
          <ScenarioComparison
            scenarios={scenarios}
            opportunity={opportunity}
            consultants={consultants}
            assignments={assignments}
            signals={signals}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
          />
        </>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center h-40">
      <p className="text-sm text-muted-foreground">
        Create a scenario to start planning the team
      </p>
    </div>
  );

  return (
    <div
      className={
        embedded
          ? 'flex min-h-full flex-col'
          : 'flex-1 flex min-h-0 flex-col overflow-hidden'
      }
    >
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {!embedded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/opportunities')}
              >
                ← Pipeline
              </Button>
            )}
            <div
              className="w-4 h-4 rounded-full mt-1 shrink-0"
              style={{ backgroundColor: opportunity.color }}
            />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {opportunity.client_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {opportunity.project_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditDialog(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant={confirmDelete ? 'destructive' : 'outline'}
              onClick={() => {
                if (confirmDelete) handleDelete();
                else setConfirmDelete(true);
              }}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Attributes row */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
          <AttrPill label="Stage">
            <Badge
              className={`text-[10px] ${PIPELINE_STAGE_BADGE_CLASSES[opportunity.stage]}`}
            >
              {PIPELINE_STAGE_LABELS[opportunity.stage]}
            </Badge>
          </AttrPill>
          <AttrPill label="Probability">
            <span className="text-sm font-semibold">
              {opportunity.probability}%
            </span>
          </AttrPill>
          <AttrPill label="Duration">
            <span className="text-sm font-medium">{weeks} weeks</span>
          </AttrPill>
          <AttrPill label="Start">
            <span className="text-sm font-medium">
              {formatIsoDate(opportunity.start_date)}
            </span>
          </AttrPill>
          <AttrPill label="End">
            <span className="text-sm font-medium">
              {formatIsoDate(opportunity.end_date)}
            </span>
          </AttrPill>
          <AttrPill label="Value">
            <span className="text-sm font-medium">
              {opportunity.estimated_value
                ? `$${Math.round(opportunity.estimated_value / 1000)}k`
                : '--'}
            </span>
          </AttrPill>
        </div>

        {/* Skills */}
        {opportunity.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {opportunity.required_skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        className={
          embedded
            ? 'flex flex-col'
            : 'flex-1 flex min-h-0 overflow-hidden'
        }
      >
        {/* Scenario tabs + editor */}
        <div
          className={
            embedded
              ? 'flex flex-col'
              : 'flex-1 flex min-h-0 flex-col overflow-hidden'
          }
        >
          {/* Scenario tabs */}
          <div className="flex items-center gap-2 px-6 py-2 border-b bg-slate-50/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">
              Scenarios
            </span>
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setActiveScenarioId(sc.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeScenarioId === sc.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border hover:bg-slate-50'
                }`}
              >
                {sc.name}
                {sc.is_default && (
                  <span className="ml-1 opacity-60">*</span>
                )}
              </button>
            ))}
            <div className="flex items-center gap-1 ml-2">
              <Input
                placeholder="New scenario..."
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddScenario();
                }}
                className="h-7 w-32 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={handleAddScenario}
                disabled={!newScenarioName.trim()}
              >
                +
              </Button>
            </div>
          </div>

          {/* Scenario editor */}
          {embedded ? (
            scenarioDetailContent
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              {scenarioDetailContent}
            </ScrollArea>
          )}
        </div>
      </div>

      <CreateOpportunityDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        editingOpportunity={opportunity}
      />
    </div>
  );
}

function AttrPill({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-slate-50/50 px-3 py-2">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
        {label}
      </Label>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
