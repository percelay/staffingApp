import type { AssignmentRole } from '@/lib/contracts/assignment';
import type { PipelineStage } from '@/lib/contracts/opportunity';
import {
  connectOrCreateSkills,
  opportunityInclude,
  prisma,
} from './shared';

type SkillList = string[];

export async function listOpportunities(filters?: {
  stage?: PipelineStage | null;
}) {
  return prisma.opportunity.findMany({
    where: filters?.stage ? { stage: filters.stage } : undefined,
    include: opportunityInclude,
    orderBy: { startDate: 'asc' },
  });
}

export async function getOpportunityById(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: opportunityInclude,
  });
}

export async function createOpportunity(data: {
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  stage: PipelineStage;
  probability: number;
  estimatedValue: number | null;
  color: string;
  isBet: boolean;
  notes: string | null;
  convertedEngagementId: string | null;
  requiredSkills: SkillList;
  defaultScenario?: {
    name: string;
    tentativeAssignments: Array<{
      consultantId: string;
      role: AssignmentRole;
      startDate: Date;
      endDate: Date;
      allocationPercentage: number;
    }>;
  };
}) {
  return prisma.opportunity.create({
    data: {
      clientName: data.clientName,
      projectName: data.projectName,
      startDate: data.startDate,
      endDate: data.endDate,
      stage: data.stage,
      probability: data.probability,
      estimatedValue: data.estimatedValue,
      color: data.color,
      isBet: data.isBet,
      notes: data.notes,
      convertedEngagementId: data.convertedEngagementId,
      requiredSkills: {
        create: connectOrCreateSkills(data.requiredSkills),
      },
      ...(data.defaultScenario
        ? {
            scenarios: {
              create: {
                name: data.defaultScenario.name,
                isDefault: true,
                tentativeAssignments: {
                  create: data.defaultScenario.tentativeAssignments,
                },
              },
            },
          }
        : {}),
    },
    include: opportunityInclude,
  });
}

export async function updateOpportunity(
  id: string,
  data: Partial<{
    clientName: string;
    projectName: string;
    startDate: Date;
    endDate: Date;
    stage: PipelineStage;
    probability: number;
    estimatedValue: number | null;
    color: string;
    isBet: boolean;
    notes: string | null;
    convertedEngagementId: string | null;
  }>,
  requiredSkills?: SkillList,
  defaultScenario?: {
    name: string;
    tentativeAssignments: Array<{
      consultantId: string;
      role: AssignmentRole;
      startDate: Date;
      endDate: Date;
      allocationPercentage: number;
    }>;
  }
) {
  await prisma.$transaction(async (tx) => {
    if (requiredSkills !== undefined) {
      await tx.opportunitySkill.deleteMany({ where: { opportunityId: id } });

      for (const skillName of requiredSkills) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        await tx.opportunitySkill.create({
          data: {
            opportunityId: id,
            skillId: skill.id,
          },
        });
      }
    }

    if (Object.keys(data).length > 0) {
      await tx.opportunity.update({
        where: { id },
        data,
      });
    }

    if (defaultScenario !== undefined) {
      const existingDefaultScenario = await tx.scenario.findFirst({
        where: { opportunityId: id, isDefault: true },
        select: { id: true },
      });

      if (existingDefaultScenario) {
        await tx.scenario.update({
          where: { id: existingDefaultScenario.id },
          data: {
            name: defaultScenario.name,
            isDefault: true,
            tentativeAssignments: {
              deleteMany: {},
              create: defaultScenario.tentativeAssignments,
            },
          },
        });
      } else {
        await tx.scenario.create({
          data: {
            opportunityId: id,
            name: defaultScenario.name,
            isDefault: true,
            tentativeAssignments: {
              create: defaultScenario.tentativeAssignments,
            },
          },
        });
      }
    }
  });

  return getOpportunityById(id);
}

export async function deleteOpportunity(id: string) {
  await prisma.opportunity.delete({ where: { id } });
}
