'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { parseISO, differenceInWeeks } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import { useConsultantStore } from '@/lib/stores/consultant-store';
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGE_BADGE_CLASSES,
  ACTIVE_PIPELINE_STAGES,
  type PipelineStage,
} from '@/lib/types/opportunity';
import { CreateOpportunityDialog } from './create-opportunity-dialog';

const KANBAN_COLUMNS: PipelineStage[] = [
  'identified',
  'qualifying',
  'proposal_sent',
  'verbal_commit',
];

const COLUMN_ACCENT: Record<PipelineStage, string> = {
  identified: 'border-t-slate-400',
  qualifying: 'border-t-blue-400',
  proposal_sent: 'border-t-amber-500',
  verbal_commit: 'border-t-emerald-500',
  won: 'border-t-green-600',
  lost: 'border-t-red-400',
};

export function OpportunityPipeline() {
  const router = useRouter();
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const scenarios = useOpportunityStore((s) => s.scenarios);
  const consultants = useConsultantStore((s) => s.consultants);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const activeOpps = useMemo(
    () => opportunities.filter((o) => ACTIVE_PIPELINE_STAGES.includes(o.stage)),
    [opportunities]
  );

  const columnData = useMemo(() => {
    return KANBAN_COLUMNS.map((stage) => ({
      stage,
      label: PIPELINE_STAGE_LABELS[stage],
      opps: activeOpps
        .filter((o) => o.stage === stage)
        .sort((a, b) => b.probability - a.probability),
    }));
  }, [activeOpps]);

  const totalPipelineValue = useMemo(
    () =>
      activeOpps.reduce(
        (sum, o) => sum + (o.estimated_value ?? 0) * (o.probability / 100),
        0
      ),
    [activeOpps]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">
            Opportunity Pipeline
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeOpps.length} active{' '}
            {activeOpps.length === 1 ? 'opportunity' : 'opportunities'} ·
            Weighted value:{' '}
            {totalPipelineValue > 0
              ? `$${Math.round(totalPipelineValue / 1000)}k`
              : '--'}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNewDialog(true)}>
          + New Opportunity
        </Button>
      </div>

      {/* Kanban board */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="grid grid-cols-4 gap-4 p-4 min-h-full">
          {columnData.map((col) => (
            <div key={col.stage} className="flex flex-col min-w-0">
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-t-lg border border-b-0 bg-slate-50 border-t-2 ${COLUMN_ACCENT[col.stage]}`}
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {col.label}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {col.opps.length}
                </Badge>
              </div>

              <div className="flex-1 border border-t-0 rounded-b-lg bg-slate-50/30 p-2 space-y-2 min-h-[200px]">
                {col.opps.map((opp) => {
                  const weeks = differenceInWeeks(
                    parseISO(opp.end_date),
                    parseISO(opp.start_date)
                  );
                  const scenario = scenarios.find(
                    (s) => s.opportunity_id === opp.id && s.is_default
                  ) || scenarios.find((s) => s.opportunity_id === opp.id);
                  const teamSize = scenario?.tentative_assignments.length ?? 0;

                  return (
                    <button
                      key={opp.id}
                      onClick={() => router.push(`/opportunities/${opp.id}`)}
                      className="w-full text-left p-3 rounded-lg border bg-white hover:shadow-sm hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: opp.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {opp.client_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {opp.project_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold"
                        >
                          {opp.probability}%
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {weeks}w
                        </span>
                        {opp.estimated_value && (
                          <span className="text-[10px] text-muted-foreground">
                            ${Math.round(opp.estimated_value / 1000)}k
                          </span>
                        )}
                        {teamSize > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {teamSize} tentative
                          </span>
                        )}
                      </div>

                      {opp.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opp.required_skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                            >
                              {skill}
                            </span>
                          ))}
                          {opp.required_skills.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{opp.required_skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}

                {col.opps.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                    No opportunities
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <CreateOpportunityDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  );
}
