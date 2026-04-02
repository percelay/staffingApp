import { prisma } from '@/lib/db';
import { toOpportunityDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';
import { normalizePipelineStage } from '@/lib/types/opportunity';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities
 * Returns all opportunities with required skills flattened.
 * Query params: ?stage=identified|qualifying|proposal_sent|verbal_commit|won|lost
 */
export const GET = withAuth('opportunities', async (request) => {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (stage) where.stage = normalizePipelineStage(stage);

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: {
      requiredSkills: { include: { skill: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return Response.json(opportunities.map(toOpportunityDTO));
});

/**
 * POST /api/opportunities
 * Create a new opportunity.
 * Body: { client_name, project_name, start_date, end_date, stage, probability,
 *         estimated_value, color, notes, required_skills: string[] }
 */
export const POST = withAuth('opportunities', async (request) => {
  const body = await request.json();
  const { required_skills, ...rest } = body;

  const opportunity = await prisma.opportunity.create({
    data: {
      clientName: rest.client_name,
      projectName: rest.project_name,
      startDate: new Date(rest.start_date),
      endDate: new Date(rest.end_date),
      stage: rest.stage ? normalizePipelineStage(rest.stage) : 'identified',
      probability: rest.probability ?? 25,
      estimatedValue: rest.estimated_value ?? null,
      color: rest.color || '#6366F1',
      isBet: rest.is_bet ?? false,
      notes: rest.notes ?? null,
      requiredSkills: {
        create: (required_skills || []).map((skillName: string) => ({
          skill: {
            connectOrCreate: {
              where: { name: skillName },
              create: { name: skillName },
            },
          },
        })),
      },
    },
    include: {
      requiredSkills: { include: { skill: true } },
    },
  });

  return Response.json(toOpportunityDTO(opportunity), { status: 201 });
});
