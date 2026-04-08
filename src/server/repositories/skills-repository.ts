import { prisma } from './shared';

export async function listSkills() {
  return prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });
}
