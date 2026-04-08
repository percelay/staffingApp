import type { AssignmentRole } from './assignment';

export const PIPELINE_STAGE_VALUES = [
  'identified',
  'qualifying',
  'proposal_sent',
  'verbal_commit',
  'won',
  'lost',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGE_VALUES)[number];

export interface Opportunity {
  id: string;
  client_name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  stage: PipelineStage;
  probability: number;
  estimated_value: number | null;
  required_skills: string[];
  color: string;
  is_bet: boolean;
  notes: string | null;
  converted_engagement_id: string | null;
}

export interface TentativeAssignmentInput {
  consultant_id: string;
  role: AssignmentRole;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}

export interface OpportunityDefaultScenarioInput {
  name?: string | null;
  tentative_assignments: TentativeAssignmentInput[];
}

export type OpportunityCreateInput = Omit<Opportunity, 'id'> & {
  default_scenario?: OpportunityDefaultScenarioInput | null;
};

export type OpportunityUpdateInput = Partial<Omit<Opportunity, 'id'>> & {
  default_scenario?: OpportunityDefaultScenarioInput | null;
};

export interface Scenario {
  id: string;
  opportunity_id: string;
  name: string;
  is_default: boolean;
  fit_score: number | null;
  burnout_impact: number | null;
  tentative_assignments: TentativeAssignment[];
}

export interface TentativeAssignment {
  id: string;
  scenario_id: string;
  consultant_id: string;
  role: AssignmentRole;
  start_date: string;
  end_date: string;
  allocation_percentage: number;
}

export function normalizePipelineStage(
  stage: string | null | undefined
): PipelineStage {
  if (stage && PIPELINE_STAGE_VALUES.includes(stage as PipelineStage)) {
    return stage as PipelineStage;
  }

  return 'identified';
}
