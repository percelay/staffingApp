import { prisma } from '@/lib/db';
import { toConsultantDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

/**
 * PUT /api/consultants/:id/goals
 * Replace the entire goal set for a consultant.
 * Body: { goals: string[] }
 *
 * Goals are skills a consultant wants to learn/develop.
 * Each goal maps to an existing Skill record.
 */
export const PUT = withAuth('consultants', async (request) => {
  const id = request.url.split('/api/consultants/')[1]?.split('/')[0]?.split('?')[0];
  const { goals } = await request.json();

  if (!Array.isArray(goals)) {
    return Response.json(
      { error: 'goals must be an array of strings' },
      { status: 400 }
    );
  }

  // Atomic: delete old, create new
  await prisma.$transaction(async (tx) => {
    await tx.consultantGoal.deleteMany({
      where: { consultantId: id },
    });

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

  // Return updated consultant
  const consultant = await prisma.consultant.findUnique({
    where: { id },
    include: { skills: { include: { skill: true } }, goals: { include: { skill: true } } },
  });

  return Response.json(toConsultantDTO(consultant!));
});
