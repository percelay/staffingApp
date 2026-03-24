import type { AssignmentRole } from './assignment';

export interface ProposalSlot {
  role: AssignmentRole;
  consultant_id: string | null;
  required: boolean;
}

export interface Proposal {
  id: string;
  engagement_id: string;
  slots: ProposalSlot[];
  fit_score: number;
  burnout_risk: number;
  created_at: string;
}
