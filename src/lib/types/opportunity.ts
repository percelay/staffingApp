export {
  normalizePipelineStage,
  type Opportunity,
  type OpportunityCreateInput,
  type OpportunityUpdateInput,
  type PipelineStage,
  type Scenario,
  type TentativeAssignment,
  type TentativeAssignmentInput,
} from '@/lib/contracts/opportunity';

import type { PipelineStage } from '@/lib/contracts/opportunity';

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  identified: 'Identified',
  qualifying: 'Qualifying',
  proposal_sent: 'Proposal Sent',
  verbal_commit: 'Verbal Commit',
  won: 'Won',
  lost: 'Lost',
};

export const PIPELINE_STAGE_BADGE_CLASSES: Record<PipelineStage, string> = {
  identified: 'bg-slate-100 text-slate-700',
  qualifying: 'bg-blue-100 text-blue-800',
  proposal_sent: 'bg-amber-100 text-amber-800',
  verbal_commit: 'bg-emerald-100 text-emerald-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-700',
};

/** Active pipeline stages (not terminal) */
export const ACTIVE_PIPELINE_STAGES: PipelineStage[] = [
  'identified',
  'qualifying',
  'proposal_sent',
  'verbal_commit',
];
