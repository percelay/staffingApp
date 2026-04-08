import type { AssignmentRole } from '@/lib/contracts/assignment';
import { prisma, scenarioInclude } from './shared';

export async function listScenarios(opportunityId?: string) {
  return prisma.scenario.findMany({
    where: opportunityId ? { opportunityId } : undefined,
    include: scenarioInclude,
    orderBy: opportunityId
      ? { createdAt: 'asc' }
      : [{ opportunityId: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function getScenarioById(id: string) {
  return prisma.scenario.findUnique({
    where: { id },
    include: scenarioInclude,
  });
}

export async function getScenarioForOpportunity(
  opportunityId: string,
  scenarioId: string
) {
  return prisma.scenario.findFirst({
    where: {
      id: scenarioId,
      opportunityId,
    },
    include: scenarioInclude,
  });
}

export async function createScenario(data: {
  opportunityId: string;
  name: string;
  isDefault: boolean;
  fitScore: number | null;
  burnoutImpact: number | null;
  tentativeAssignments: Array<{
    consultantId: string;
    role: AssignmentRole;
    startDate: Date;
    endDate: Date;
    allocationPercentage: number;
  }>;
}) {
  return prisma.scenario.create({
    data: {
      opportunityId: data.opportunityId,
      name: data.name,
      isDefault: data.isDefault,
      fitScore: data.fitScore,
      burnoutImpact: data.burnoutImpact,
      tentativeAssignments: {
        create: data.tentativeAssignments,
      },
    },
    include: scenarioInclude,
  });
}

export async function updateScenario(
  id: string,
  data: Partial<{
    name: string;
    isDefault: boolean;
    fitScore: number | null;
    burnoutImpact: number | null;
  }>,
  tentativeAssignments?: Array<{
    consultantId: string;
    role: AssignmentRole;
    startDate: Date;
    endDate: Date;
    allocationPercentage: number;
  }>
) {
  await prisma.$transaction(async (tx) => {
    if (tentativeAssignments !== undefined) {
      await tx.tentativeAssignment.deleteMany({ where: { scenarioId: id } });

      for (const tentativeAssignment of tentativeAssignments) {
        await tx.tentativeAssignment.create({
          data: {
            scenarioId: id,
            consultantId: tentativeAssignment.consultantId,
            role: tentativeAssignment.role,
            startDate: tentativeAssignment.startDate,
            endDate: tentativeAssignment.endDate,
            allocationPercentage: tentativeAssignment.allocationPercentage,
          },
        });
      }
    }

    if (Object.keys(data).length > 0) {
      await tx.scenario.update({
        where: { id },
        data,
      });
    }
  });

  return getScenarioById(id);
}

export async function deleteScenario(id: string) {
  await prisma.scenario.delete({ where: { id } });
}

export async function createTentativeAssignment(data: {
  scenarioId: string;
  consultantId: string;
  role: AssignmentRole;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
}) {
  return prisma.tentativeAssignment.create({
    data: {
      scenarioId: data.scenarioId,
      consultantId: data.consultantId,
      role: data.role,
      startDate: data.startDate,
      endDate: data.endDate,
      allocationPercentage: data.allocationPercentage,
    },
  });
}

export async function getTentativeAssignmentById(id: string) {
  return prisma.tentativeAssignment.findUnique({
    where: { id },
  });
}

export async function getTentativeAssignmentForScenario(
  opportunityId: string,
  scenarioId: string,
  assignmentId: string
) {
  return prisma.tentativeAssignment.findFirst({
    where: {
      id: assignmentId,
      scenarioId,
      scenario: {
        opportunityId,
      },
    },
  });
}

export async function updateTentativeAssignment(
  id: string,
  data: Partial<{
    consultantId: string;
    role: AssignmentRole;
    startDate: Date;
    endDate: Date;
    allocationPercentage: number;
  }>
) {
  return prisma.tentativeAssignment.update({
    where: { id },
    data,
  });
}

export async function deleteTentativeAssignment(id: string) {
  await prisma.tentativeAssignment.delete({ where: { id } });
}
