import type { EngagementStatus } from '@/lib/contracts/engagement';
import {
  connectOrCreateSkills,
  engagementInclude,
  prisma,
} from './shared';

type SkillList = string[];

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
