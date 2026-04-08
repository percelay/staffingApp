import { prisma } from '@/lib/db';
import type {
  AssignmentRole,
} from '@/lib/types/assignment';
import type {
  ConsultantStatus,
  PracticeArea,
  SeniorityLevel,
} from '@/lib/types/consultant';
import type { EngagementStatus } from '@/lib/types/engagement';
import type { PipelineStage } from '@/lib/types/opportunity';
import type { Severity, SignalType } from '@/lib/types/wellbeing';

const consultantInclude = {
  skills: { include: { skill: true } },
  goals: { include: { skill: true } },
} as const;

const engagementInclude = {
  requiredSkills: { include: { skill: true } },
} as const;

const opportunityInclude = {
  requiredSkills: { include: { skill: true } },
} as const;

const scenarioInclude = {
  tentativeAssignments: true,
} as const;

type SkillList = string[];

export async function listConsultants(filters?: {
  status?: ConsultantStatus | 'all';
  practiceArea?: PracticeArea | null;
}) {
  return prisma.consultant.findMany({
    where: {
      ...(filters?.status && filters.status !== 'all'
        ? { status: filters.status }
        : {}),
      ...(filters?.practiceArea ? { practiceArea: filters.practiceArea } : {}),
    },
    include: consultantInclude,
    orderBy: [{ seniorityLevel: 'desc' }, { name: 'asc' }],
  });
}

export async function getConsultantById(id: string) {
  return prisma.consultant.findUnique({
    where: { id },
    include: consultantInclude,
  });
}

export async function createConsultant(data: {
  name: string;
  role: string;
  practiceArea: PracticeArea;
  seniorityLevel: SeniorityLevel;
  avatarUrl: string;
  status: ConsultantStatus;
  skills: SkillList;
  goals: SkillList;
}) {
  return prisma.consultant.create({
    data: {
      name: data.name,
      role: data.role,
      practiceArea: data.practiceArea,
      seniorityLevel: data.seniorityLevel,
      avatarUrl: data.avatarUrl,
      status: data.status,
      skills: {
        create: connectOrCreateSkills(data.skills),
      },
      goals: {
        create: connectOrCreateSkills(data.goals),
      },
    },
    include: consultantInclude,
  });
}

export async function updateConsultant(
  id: string,
  data: Partial<{
    name: string;
    role: string;
    practiceArea: PracticeArea;
    seniorityLevel: SeniorityLevel;
    avatarUrl: string;
    status: ConsultantStatus;
  }>
) {
  return prisma.consultant.update({
    where: { id },
    data,
    include: consultantInclude,
  });
}

export async function softDeleteConsultant(id: string) {
  return prisma.consultant.update({
    where: { id },
    data: { status: 'departed' },
    include: consultantInclude,
  });
}

export async function replaceConsultantSkills(id: string, skills: SkillList) {
  await prisma.$transaction(async (tx) => {
    await tx.consultantSkill.deleteMany({ where: { consultantId: id } });

    for (const skillName of skills) {
      const skill = await tx.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });

      await tx.consultantSkill.create({
        data: {
          consultantId: id,
          skillId: skill.id,
        },
      });
    }
  });

  return getConsultantById(id);
}

export async function replaceConsultantGoals(id: string, goals: SkillList) {
  await prisma.$transaction(async (tx) => {
    await tx.consultantGoal.deleteMany({ where: { consultantId: id } });

    for (const skillName of goals) {
      const skill = await tx.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName },
      });

      await tx.consultantGoal.create({
        data: {
          consultantId: id,
          skillId: skill.id,
        },
      });
    }
  });

  return getConsultantById(id);
}

export async function listEngagements(filters?: {
  status?: EngagementStatus | null;
}) {
  return prisma.engagement.findMany({
    where: filters?.status ? { status: filters.status } : undefined,
    include: engagementInclude,
    orderBy: { startDate: 'asc' },
  });
}

export async function getEngagementById(id: string) {
  return prisma.engagement.findUnique({
    where: { id },
    include: engagementInclude,
  });
}

export async function createEngagement(data: {
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  status: EngagementStatus;
  color: string;
  isBet: boolean;
  requiredSkills: SkillList;
}) {
  return prisma.engagement.create({
    data: {
      clientName: data.clientName,
      projectName: data.projectName,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      color: data.color,
      isBet: data.isBet,
      requiredSkills: {
        create: connectOrCreateSkills(data.requiredSkills),
      },
    },
    include: engagementInclude,
  });
}

export async function updateEngagement(
  id: string,
  data: Partial<{
    clientName: string;
    projectName: string;
    startDate: Date;
    endDate: Date;
    status: EngagementStatus;
    color: string;
    isBet: boolean;
  }>,
  requiredSkills?: SkillList
) {
  await prisma.$transaction(async (tx) => {
    if (requiredSkills) {
      await tx.engagementSkill.deleteMany({ where: { engagementId: id } });

      for (const skillName of requiredSkills) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        await tx.engagementSkill.create({
          data: {
            engagementId: id,
            skillId: skill.id,
          },
        });
      }
    }

    if (Object.keys(data).length > 0) {
      await tx.engagement.update({
        where: { id },
        data,
      });
    }
  });

  return getEngagementById(id);
}

export async function deleteEngagement(id: string) {
  await prisma.engagement.delete({ where: { id } });
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

export async function listWellbeingSignals(filters?: {
  consultantId?: string | null;
}) {
  return prisma.wellbeingSignal.findMany({
    where: filters?.consultantId
      ? { consultantId: filters.consultantId }
      : undefined,
    orderBy: { recordedAt: 'desc' },
  });
}

export async function createWellbeingSignal(data: {
  consultantId: string;
  signalType: SignalType;
  severity: Severity;
  recordedAt: Date;
  notes: string | null;
}) {
  return prisma.wellbeingSignal.create({
    data,
  });
}

export async function listSkills() {
  return prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });
}

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

export async function listScenarios(opportunityId?: string) {
  return prisma.scenario.findMany({
    where: opportunityId ? { opportunityId } : undefined,
    include: scenarioInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function getScenarioById(id: string) {
  return prisma.scenario.findUnique({
    where: { id },
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

function connectOrCreateSkills(skillNames: SkillList) {
  return skillNames.map((skillName) => ({
    skill: {
      connectOrCreate: {
        where: { name: skillName },
        create: { name: skillName },
      },
    },
  }));
}
