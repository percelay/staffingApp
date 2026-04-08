import type { AssignmentRole } from '@/lib/contracts/assignment';
import { prisma } from './shared';

export async function listProposals() {
  return prisma.proposal.findMany({
    include: {
      slots: { orderBy: { sortOrder: 'asc' } },
      engagement: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProposalById(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      slots: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function createProposal(data: {
  engagementId: string;
  fitScore: number;
  burnoutRisk: number;
  slots: Array<{
    role: AssignmentRole;
    consultantId: string | null;
    required: boolean;
  }>;
}) {
  return prisma.proposal.create({
    data: {
      engagementId: data.engagementId,
      fitScore: data.fitScore,
      burnoutRisk: data.burnoutRisk,
      slots: {
        create: data.slots.map((slot, index) => ({
          role: slot.role,
          consultantId: slot.consultantId,
          required: slot.required,
          sortOrder: index,
        })),
      },
    },
    include: {
      slots: { orderBy: { sortOrder: 'asc' } },
    },
  });
}
