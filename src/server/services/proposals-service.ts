import type { ProposalCreateInput } from '@/server/schemas/proposals';
import {
  createProposal,
  getProposalById,
  listProposals,
} from '@/server/repositories/proposals-repository';
import { serializeProposal } from '@/server/serializers/proposals';

export async function getProposals() {
  const records = await listProposals();
  return records.map(serializeProposal);
}

export async function getProposal(id: string) {
  const record = await getProposalById(id);
  return record ? serializeProposal(record) : null;
}

export async function createProposalFromInput(input: ProposalCreateInput) {
  const record = await createProposal({
    engagementId: input.engagement_id,
    fitScore: input.fit_score,
    burnoutRisk: input.burnout_risk,
    slots: input.slots.map((slot) => ({
      role: slot.role,
      consultantId: slot.consultant_id,
      required: slot.required,
    })),
  });

  return serializeProposal(record);
}
