import type {
  ConsultantStatus,
  PracticeArea,
  SeniorityLevel,
} from '@/lib/contracts/consultant';
import {
  connectOrCreateSkills,
  consultantInclude,
  prisma,
} from './shared';

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
