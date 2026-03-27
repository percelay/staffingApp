import { prisma } from '@/lib/db';
import { toEngagementDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

/**
 * GET /api/engagements/:id
 * Returns a single engagement with required skills.
 */
export const GET = withAuth('engagements', async (request) => {
  const id = request.url.split('/api/engagements/')[1]?.split('/')[0]?.split('?')[0];

  const engagement = await prisma.engagement.findUnique({
    where: { id },
    include: { requiredSkills: { include: { skill: true } } },
  });

  if (!engagement) {
    return Response.json({ error: 'Engagement not found' }, { status: 404 });
  }

  return Response.json(toEngagementDTO(engagement));
});

/**
 * PATCH /api/engagements/:id
 * Update engagement fields (timelines, status, skills, etc.)
 * Body: partial Engagement fields in snake_case.
 *       If required_skills is provided, it replaces the entire skill set.
 */
export const PATCH = withAuth('engagements', async (request) => {
  const id = request.url.split('/api/engagements/')[1]?.split('/')[0]?.split('?')[0];
  const body = await request.json();

  // Handle skills replacement atomically if provided
  if (body.required_skills) {
    await prisma.$transaction(async (tx) => {
      await tx.engagementSkill.deleteMany({ where: { engagementId: id } });
      for (const skillName of body.required_skills) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        await tx.engagementSkill.create({
          data: { engagementId: id, skillId: skill.id },
        });
      }
    });
  }

  // Map snake_case to camelCase for scalar fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.client_name !== undefined) data.clientName = body.client_name;
  if (body.project_name !== undefined) data.projectName = body.project_name;
  if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
  if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
  if (body.status !== undefined) data.status = body.status;
  if (body.color !== undefined) data.color = body.color;

  // Only run update if there are scalar changes
  if (Object.keys(data).length > 0) {
    await prisma.engagement.update({ where: { id }, data });
  }

  // Return full updated engagement
  const engagement = await prisma.engagement.findUnique({
    where: { id },
    include: { requiredSkills: { include: { skill: true } } },
  });

  return Response.json(toEngagementDTO(engagement!));
});

/**
 * DELETE /api/engagements/:id
 * Hard-deletes an engagement. Requires partner role.
 * Cascade deletes assignments, proposals, skills.
 */
export const DELETE = withAuth('engagements', async (request) => {
  const id = request.url.split('/api/engagements/')[1]?.split('/')[0]?.split('?')[0];

  await prisma.engagement.delete({ where: { id } });

  return Response.json({ success: true });
});
