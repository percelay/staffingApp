import type { AssignmentRole } from '@/lib/contracts/assignment';
import { prisma } from './shared';

export async function getAssignmentById(id: string) {
  return prisma.assignment.findUnique({
    where: { id },
  });
}

export async function listAssignments(filters?: {
  consultantId?: string | null;
  engagementId?: string | null;
}) {
  return prisma.assignment.findMany({
    where: {
      ...(filters?.consultantId ? { consultantId: filters.consultantId } : {}),
      ...(filters?.engagementId ? { engagementId: filters.engagementId } : {}),
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function createAssignment(data: {
  consultantId: string;
  engagementId: string;
  role: AssignmentRole;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
  notes: string | null;
}) {
  return prisma.assignment.create({
    data,
  });
}

export async function updateAssignment(
  id: string,
  data: Partial<{
    consultantId: string;
    engagementId: string;
    role: AssignmentRole;
    startDate: Date;
    endDate: Date;
    allocationPercentage: number;
    notes: string | null;
  }>
) {
  return prisma.assignment.update({
    where: { id },
    data,
  });
}

export async function deleteAssignment(id: string) {
  await prisma.assignment.delete({ where: { id } });
}
