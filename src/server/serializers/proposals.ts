import type { Proposal } from '@/lib/contracts/proposal';

type ProposalRecord = {
  id: string;
  engagementId: string;
  fitScore: number;
  burnoutRisk: number;
  createdAt: Date;
  slots: Array<{
    role: string;
    consultantId: string | null;
    required: boolean;
  }>;
};

export function serializeProposal(record: ProposalRecord): Proposal {
  return {
    id: record.id,
    engagement_id: record.engagementId,
    fit_score: record.fitScore,
    burnout_risk: record.burnoutRisk,
    created_at: record.createdAt.toISOString(),
    slots: record.slots.map((slot) => ({
      role: slot.role as Proposal['slots'][number]['role'],
      consultant_id: slot.consultantId,
      required: slot.required,
    })),
  };
}
