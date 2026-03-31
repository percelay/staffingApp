import { prisma } from '@/lib/db';
import { toOpportunityDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';
import { normalizePipelineStage } from '@/lib/types/opportunity';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id
 */
export const GET = withAuth('opportunities', async (request) => {
  const id = request.url.split('/api/opportunities/')[1]?.split('/')[0]?.split('?')[0];

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { requiredSkills: { include: { skill: true } } },
  });

  if (!opportunity) {
    return Response.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  return Response.json(toOpportunityDTO(opportunity));
});

/**
 * PATCH /api/opportunities/:id
 */
export const PATCH = withAuth('opportunities', async (request) => {
  const id = request.url.split('/api/opportunities/')[1]?.split('/')[0]?.split('?')[0];
  const body = await request.json();

  if (body.required_skills) {
    await prisma.$transaction(async (tx) => {
      await tx.opportunitySkill.deleteMany({ where: { opportunityId: id } });
      for (const skillName of body.required_skills) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        await tx.opportunitySkill.create({
          data: { opportunityId: id, skillId: skill.id },
        });
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.client_name !== undefined) data.clientName = body.client_name;
  if (body.project_name !== undefined) data.projectName = body.project_name;
  if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
  if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
  if (body.stage !== undefined) data.stage = normalizePipelineStage(body.stage);
  if (body.probability !== undefined) data.probability = body.probability;
  if (body.estimated_value !== undefined) data.estimatedValue = body.estimated_value;
  if (body.color !== undefined) data.color = body.color;
  if (body.notes !== undefined) data.notes = body.notes;

  if (Object.keys(data).length > 0) {
    await prisma.opportunity.update({ where: { id }, data });
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { requiredSkills: { include: { skill: true } } },
  });

  return Response.json(toOpportunityDTO(opportunity!));
});

/**
 * DELETE /api/opportunities/:id
 */
export const DELETE = withAuth('opportunities', async (request) => {
  const id = request.url.split('/api/opportunities/')[1]?.split('/')[0]?.split('?')[0];

  await prisma.opportunity.delete({ where: { id } });

  return Response.json({ success: true });
});
