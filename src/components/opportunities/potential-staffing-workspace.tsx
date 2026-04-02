'use client';

import { useMemo, useState } from 'react';
import { differenceInWeeks, parseISO } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import {
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
} from '@/lib/types/opportunity';
import { CreateOpportunityDialog } from './create-opportunity-dialog';
import { OpportunityDetail } from './opportunity-detail';

const PIPELINE_STAGE_ORDER: Record<PipelineStage, number> = {
  identified: 0,
  qualifying: 1,
  proposal_sent: 2,
  verbal_commit: 3,
  won: 4,
  lost: 5,
};

export function PotentialStaffingWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const opportunities = useOpportunityStore((state) => state.opportunities);
  const scenarios = useOpportunityStore((state) => state.scenarios);

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');

  const filteredOpportunities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...opportunities]
      .filter((opportunity) => {
        if (stageFilter !== 'all' && opportunity.stage !== stageFilter) {
          return false;
        }
        if (!query) {
          return true;
        }

        return (
          opportunity.client_name.toLowerCase().includes(query) ||
          opportunity.project_name.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => {
        const stageDelta =
          PIPELINE_STAGE_ORDER[left.stage] - PIPELINE_STAGE_ORDER[right.stage];
        if (stageDelta !== 0) {
          return stageDelta;
        }

        return left.start_date.localeCompare(right.start_date);
      });
  }, [opportunities, searchQuery, stageFilter]);

  const selectedId = useMemo(() => {
    const opportunityId = searchParams.get('opportunityId');
    if (
      opportunityId &&
      opportunities.some((opportunity) => opportunity.id === opportunityId)
    ) {
      return opportunityId;
    }

    return filteredOpportunities[0]?.id ?? opportunities[0]?.id ?? null;
  }, [filteredOpportunities, opportunities, searchParams]);

  const handleDeleted = () => {
    const remaining = filteredOpportunities.filter(
      (opportunity) => opportunity.id !== selectedId
    );
    const fallbackOpportunity = opportunities.find(
      (opportunity) => opportunity.id !== selectedId
    );
    const nextId = remaining[0]?.id ?? fallbackOpportunity?.id ?? null;
    router.replace(
      nextId ? `/potential/staffing?opportunityId=${nextId}` : '/potential/staffing'
    );
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex w-[340px] flex-col overflow-hidden border-r bg-white">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Opportunity Staffing
            </h2>
            <Button size="sm" onClick={() => setShowNewDialog(true)}>
              + New
            </Button>
          </div>

          <Input
            placeholder="Search clients or opportunities..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-8 text-sm"
          />

          <Select
            value={stageFilter}
            onValueChange={(value) =>
              setStageFilter(value as PipelineStage | 'all')
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {Object.entries(PIPELINE_STAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {filteredOpportunities.map((opportunity) => {
              const defaultScenario =
                scenarios.find(
                  (scenario) =>
                    scenario.opportunity_id === opportunity.id && scenario.is_default
                ) ??
                scenarios.find(
                  (scenario) => scenario.opportunity_id === opportunity.id
                );
              const teamCount =
                defaultScenario?.tentative_assignments.length ?? 0;
              const isSelected = selectedId === opportunity.id;
              const weeks = differenceInWeeks(
                parseISO(opportunity.end_date),
                parseISO(opportunity.start_date)
              );

              return (
                <button
                  key={opportunity.id}
                  onClick={() =>
                    router.replace(
                      `/potential/staffing?opportunityId=${opportunity.id}`
                    )
                  }
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: opportunity.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {opportunity.client_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {opportunity.project_name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {PIPELINE_STAGE_LABELS[opportunity.stage]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {teamCount} member{teamCount === 1 ? '' : 's'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {weeks}w
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredOpportunities.length === 0 && (
              <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm">No opportunities found</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1"
                  onClick={() => setShowNewDialog(true)}
                >
                  Create one
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="min-h-0 flex-1 bg-slate-50/30">
        {selectedId ? (
          <OpportunityDetail
            opportunityId={selectedId}
            embedded
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Select an opportunity
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                or create a new one to start staffing
              </p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                + New Opportunity
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateOpportunityDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={(opportunity) => {
          router.replace(`/potential/staffing?opportunityId=${opportunity.id}`);
        }}
      />
    </div>
  );
}
