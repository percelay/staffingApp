'use client';

import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOpportunityStore } from '@/lib/stores/opportunity-store';
import { CreateOpportunityDialog } from '@/components/opportunities/create-opportunity-dialog';
import type { Opportunity, PipelineStage } from '@/lib/types/opportunity';
import {
  PIPELINE_STAGE_BADGE_CLASSES,
} from '@/lib/types/opportunity';

// ─── Board column definitions ──────────────────────────────────────

interface ColumnDef {
  id: PipelineStage;
  label: string;
  color: string;        // accent for header border
  bgHover: string;      // background when dragging over
  stages: PipelineStage[];
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'qualifying',
    label: 'Leads',
    color: 'border-blue-400',
    bgHover: 'bg-blue-50',
    stages: ['identified', 'qualifying'],
  },
  {
    id: 'proposal_sent',
    label: 'Proposal Stage',
    color: 'border-amber-500',
    bgHover: 'bg-amber-50',
    stages: ['proposal_sent'],
  },
  {
    id: 'verbal_commit',
    label: 'Verbal Commit',
    color: 'border-emerald-500',
    bgHover: 'bg-emerald-50',
    stages: ['verbal_commit'],
  },
];

// Map column IDs to the default stage when dropping
const COLUMN_DROP_STAGE: Record<string, PipelineStage> = {
  qualifying: 'qualifying',
  proposal_sent: 'proposal_sent',
  verbal_commit: 'verbal_commit',
};

// ─── Main Board ────────────────────────────────────────────────────

export function OpportunityBoard() {
  const opportunities = useOpportunityStore((s) => s.opportunities);
  const updateOpportunity = useOpportunityStore((s) => s.updateOpportunity);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultStage, setCreateDefaultStage] = useState<PipelineStage>('identified');
  const [editingOpp, setEditingOpp] = useState<Opportunity | undefined>();

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Group opportunities by column
  const columnData = useMemo(() => {
    const result: Record<string, Opportunity[]> = {};
    for (const col of COLUMNS) {
      result[col.id] = opportunities
        .filter((o) => col.stages.includes(o.stage))
        .sort((a, b) => b.probability - a.probability);
    }
    return result;
  }, [opportunities]);

  // ─── Drag handlers ────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, oppId: string) => {
    setDraggedId(oppId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', oppId);
    // Add a slight delay before applying drag styles
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-opp-id="${oppId}"]`);
      if (el) el.classList.add('opacity-40');
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedId) {
      const el = document.querySelector(`[data-opp-id="${draggedId}"]`);
      if (el) el.classList.remove('opacity-40');
    }
    setDraggedId(null);
    setDropTarget(null);
  }, [draggedId]);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(columnId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, columnId: string) => {
    // Only clear if we're actually leaving the column (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      if (dropTarget === columnId) setDropTarget(null);
    }
  }, [dropTarget]);

  const handleDrop = useCallback(async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDropTarget(null);

    const oppId = e.dataTransfer.getData('text/plain');
    if (!oppId) return;

    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp) return;

    const targetStage = COLUMN_DROP_STAGE[columnId];
    if (!targetStage || opp.stage === targetStage) {
      // Check if already in the target column's stages
      const col = COLUMNS.find((c) => c.id === columnId);
      if (col?.stages.includes(opp.stage)) return;
    }

    await updateOpportunity(oppId, { stage: targetStage });
  }, [opportunities, updateOpportunity]);

  // ─── Quick create per column ──────────────────────────────────

  const handleAddToColumn = (columnId: string) => {
    const stage = COLUMN_DROP_STAGE[columnId] || 'identified';
    setCreateDefaultStage(stage);
    setEditingOpp(undefined);
    setCreateOpen(true);
  };

  const handleEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    setCreateOpen(true);
  };

  // Column totals
  const columnTotals = useMemo(() => {
    const result: Record<string, { count: number; value: number }> = {};
    for (const col of COLUMNS) {
      const opps = columnData[col.id] || [];
      result[col.id] = {
        count: opps.length,
        value: opps.reduce((sum, o) => sum + (o.estimated_value ?? 0), 0),
      };
    }
    return result;
  }, [columnData]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Opportunities</h1>
            <p className="text-sm text-muted-foreground">
              {opportunities.filter((o) => !['won', 'lost'].includes(o.stage)).length} active opportunities in pipeline
            </p>
          </div>
          <Button
            onClick={() => {
              setCreateDefaultStage('identified');
              setEditingOpp(undefined);
              setCreateOpen(true);
            }}
          >
            + New Opportunity
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto min-h-0">
        {COLUMNS.map((col) => {
          const isOver = dropTarget === col.id;
          const opps = columnData[col.id] || [];
          const totals = columnTotals[col.id];

          return (
            <div
              key={col.id}
              className={`flex flex-col flex-1 min-w-[300px] max-w-[420px] rounded-lg border bg-muted/30 transition-colors duration-150 ${
                isOver ? col.bgHover + ' border-dashed border-2' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`p-3 border-b-2 ${col.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{col.label}</h2>
                    <Badge variant="secondary" className="text-[10px]">
                      {totals.count}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleAddToColumn(col.id)}
                    className="text-muted-foreground hover:text-foreground text-lg leading-none px-1 transition-colors"
                    title={`Add to ${col.label}`}
                  >
                    +
                  </button>
                </div>
                {totals.value > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ${(totals.value / 1000).toFixed(0)}k pipeline value
                  </p>
                )}
              </div>

              {/* Column Cards */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 space-y-2">
                  {opps.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onEdit={handleEdit}
                      isDragging={draggedId === opp.id}
                    />
                  ))}

                  {opps.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <p className="text-xs">No opportunities</p>
                      <button
                        onClick={() => handleAddToColumn(col.id)}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        Add one
                      </button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <CreateOpportunityDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditingOpp(undefined);
        }}
        editingOpportunity={editingOpp}
        defaultStage={createDefaultStage}
        onCreated={() => {
          // Opportunities are already added to store by addOpportunity
        }}
      />
    </div>
  );
}

// ─── Opportunity Card ──────────────────────────────────────────────

interface CardProps {
  opportunity: Opportunity;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onEdit: (opp: Opportunity) => void;
  isDragging: boolean;
}

function OpportunityCard({ opportunity, onDragStart, onDragEnd, onEdit, isDragging }: CardProps) {
  const updateOpportunity = useOpportunityStore((s) => s.updateOpportunity);

  const handleBetToggle = async (checked: boolean) => {
    await updateOpportunity(opportunity.id, { is_bet: checked });
  };

  const probabilityColor = opportunity.probability >= 70
    ? 'text-emerald-600'
    : opportunity.probability >= 40
    ? 'text-amber-600'
    : 'text-slate-500';

  return (
    <div
      data-opp-id={opportunity.id}
      draggable
      onDragStart={(e) => onDragStart(e, opportunity.id)}
      onDragEnd={onDragEnd}
      className={`group rounded-lg border bg-white p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all ${
        isDragging ? 'opacity-40 ring-2 ring-primary/20' : ''
      }`}
    >
      {/* Clickable content area — opens edit */}
      <div
        className="cursor-pointer"
        onClick={() => onEdit(opportunity)}
      >
        {/* Color bar + client */}
        <div className="flex items-start gap-2.5">
          <div
            className="w-1 h-10 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: opportunity.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{opportunity.client_name}</p>
            <p className="text-xs text-muted-foreground truncate">{opportunity.project_name}</p>
          </div>
          <span className={`text-sm font-bold shrink-0 ${probabilityColor}`}>
            {opportunity.probability}%
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${PIPELINE_STAGE_BADGE_CLASSES[opportunity.stage]}`}>
            {opportunity.stage === 'identified' ? 'Identified' :
             opportunity.stage === 'qualifying' ? 'Qualifying' :
             opportunity.stage === 'proposal_sent' ? 'Proposal Sent' :
             'Verbal Commit'}
          </Badge>
          {opportunity.estimated_value != null && opportunity.estimated_value > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ${(opportunity.estimated_value / 1000).toFixed(0)}k
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(opportunity.start_date), 'MMM d')} — {format(new Date(opportunity.end_date), 'MMM d')}
          </span>
        </div>

        {/* Skills */}
        {opportunity.required_skills.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {opportunity.required_skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[9px] px-1.5 py-0">
                {skill}
              </Badge>
            ))}
            {opportunity.required_skills.length > 3 && (
              <span className="text-[9px] text-muted-foreground self-center">
                +{opportunity.required_skills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bet toggle — separate from clickable area */}
      <div
        className="flex items-center justify-between mt-2.5 pt-2 border-t"
        onClick={(e) => e.stopPropagation()}
      >
        <span className={`text-[10px] font-medium ${opportunity.is_bet ? 'text-violet-600' : 'text-muted-foreground'}`}>
          {opportunity.is_bet ? 'Strategic Bet' : 'Bet'}
        </span>
        <Switch
          checked={opportunity.is_bet}
          onCheckedChange={handleBetToggle}
          className="scale-75 origin-right"
        />
      </div>
    </div>
  );
}
