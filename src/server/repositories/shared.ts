import { prisma } from '@/lib/db';

export const consultantInclude = {
  skills: { include: { skill: true } },
  goals: { include: { skill: true } },
} as const;

export const engagementInclude = {
  requiredSkills: { include: { skill: true } },
} as const;

export const opportunityInclude = {
  requiredSkills: { include: { skill: true } },
} as const;

export const scenarioInclude = {
  tentativeAssignments: true,
} as const;

export function connectOrCreateSkills(skillNames: string[]) {
  return skillNames.map((skillName) => ({
    skill: {
      connectOrCreate: {
        where: { name: skillName },
        create: { name: skillName },
      },
    },
  }));
}

export { prisma };
