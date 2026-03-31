import { prisma } from '@/lib/db';
import { toEngagementDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';
import { normalizeEngagementStatus } from '@/lib/types/engagement';

export const dynamic = 'force-dynamic';

/**
 * GET /api/engagements
 * Returns all engagements with required skills flattened.
 * Query params: ?status=active|upcoming|completed
 */
export const GET = withAuth('engagements', async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = normalizeEngagementStatus(status);

  const engagements = await prisma.engagement.findMany({
    where,
    include: {
      requiredSkills: { include: { skill: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return Response.json(engagements.map(toEngagementDTO));
});

/**
 * POST /api/engagements
 * Create a new engagement (project). Requires partner role.
 * Body: { client_name, project_name, start_date, end_date, status, color, required_skills: string[] }
 */
export const POST = withAuth('engagements', async (request) => {
  const body = await request.json();
  const { required_skills, ...rest } = body;

  const engagement = await prisma.engagement.create({
    data: {
      clientName: rest.client_name,
      projectName: rest.project_name,
      startDate: new Date(rest.start_date),
      endDate: new Date(rest.end_date),
      status: rest.status ? normalizeEngagementStatus(rest.status) : 'upcoming',
      color: rest.color || '#4F46E5',
      isBet: rest.is_bet ?? false,
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

  return Response.json(toEngagementDTO(engagement), { status: 201 });
});
