import { prisma } from '@/lib/db';
import { toConsultantDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

/**
 * PUT /api/consultants/:id/skills
 * Replace the entire skill set for a consultant.
 * Body: { skills: string[] }
 *
 * This is an atomic operation:
 *   1. Delete all existing consultant_skills
 *   2. Create new ones from the provided array
 *   3. Auto-creates skills that don't exist yet
 */
export const PUT = withAuth('consultants', async (request) => {
  const id = request.url.split('/api/consultants/')[1]?.split('/')[0]?.split('?')[0];
  const { skills } = await request.json();

  if (!Array.isArray(skills)) {
    return Response.json(
      { error: 'skills must be an array of strings' },
      { status: 400 }
    );
  }

  // Atomic: delete old, create new
  await prisma.$transaction(async (tx) => {
    // Remove all existing skills for this consultant
    await tx.consultantSkill.deleteMany({
      where: { consultantId: id },
    });

    // Add new skills (connectOrCreate ensures skill table stays in sync)
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

  // Return updated consultant
  const consultant = await prisma.consultant.findUnique({
    where: { id },
    include: { skills: { include: { skill: true } } },
  });

  return Response.json(toConsultantDTO(consultant!));
});
