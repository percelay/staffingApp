import { prisma } from '@/lib/db';
import { toConsultantDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consultants
 * Returns all active consultants with skills flattened to string[].
 * Query params: ?status=active|on_leave|departed (default: active)
 *               ?practiceArea=strategy|operations|digital|risk|people
 */
export const GET = withAuth('consultants', async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';
  const practiceArea = searchParams.get('practiceArea');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (status !== 'all') where.status = status;
  if (practiceArea) where.practiceArea = practiceArea;

  const consultants = await prisma.consultant.findMany({
    where,
    include: {
      skills: { include: { skill: true } },
      goals: { include: { skill: true } },
    },
    orderBy: [{ seniorityLevel: 'desc' }, { name: 'asc' }],
  });

  return Response.json(consultants.map(toConsultantDTO));
});

/**
 * POST /api/consultants
 * Create a new consultant. Requires partner role.
 * Body: { name, role, practice_area, seniority_level, skills: string[], avatar_url }
 */
export const POST = withAuth('consultants', async (request) => {
  const body = await request.json();
  const { skills, goals, ...rest } = body;

  // Map snake_case frontend fields to camelCase Prisma fields
  const consultant = await prisma.consultant.create({
    data: {
      name: rest.name,
      role: rest.role,
      practiceArea: rest.practice_area,
      seniorityLevel: rest.seniority_level,
      avatarUrl: rest.avatar_url || `https://api.dicebear.com/9.x/notionists/svg?seed=${Date.now()}`,
      status: 'active',
      skills: {
        create: (skills || []).map((skillName: string) => ({
          skill: {
            connectOrCreate: {
              where: { name: skillName },
              create: { name: skillName },
            },
          },
        })),
      },
      goals: {
        create: (goals || []).map((skillName: string) => ({
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
      skills: { include: { skill: true } },
      goals: { include: { skill: true } },
    },
  });

  return Response.json(toConsultantDTO(consultant), { status: 201 });
});
