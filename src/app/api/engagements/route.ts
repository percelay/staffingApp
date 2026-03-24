import { prisma } from '@/lib/db';
import { toEngagementDTO } from '@/lib/api/transformers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/engagements
 * Returns all engagements with required skills flattened.
 * Query params: ?status=active|upcoming|completed|at_risk
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status) where.status = status;

  const engagements = await prisma.engagement.findMany({
    where,
    include: {
      requiredSkills: { include: { skill: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return Response.json(engagements.map(toEngagementDTO));
}

/**
 * POST /api/engagements
 * Create a new engagement (project).
 * Body: { client_name, project_name, start_date, end_date, status, color, required_skills: string[] }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { required_skills, ...rest } = body;

  const engagement = await prisma.engagement.create({
    data: {
      clientName: rest.client_name,
      projectName: rest.project_name,
      startDate: new Date(rest.start_date),
      endDate: new Date(rest.end_date),
      status: rest.status || 'upcoming',
      color: rest.color || '#4F46E5',
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
}
