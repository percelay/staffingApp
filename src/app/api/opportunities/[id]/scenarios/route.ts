import { prisma } from '@/lib/db';
import { toScenarioDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id/scenarios
 */
export const GET = withAuth('opportunities', async (request) => {
  const opportunityId = request.url.split('/api/opportunities/')[1]?.split('/')[0];

  const scenarios = await prisma.scenario.findMany({
    where: { opportunityId },
    include: { tentativeAssignments: true },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json(scenarios.map(toScenarioDTO));
});

/**
 * POST /api/opportunities/:id/scenarios
 * Body: { name, is_default?, tentative_assignments?: [...] }
 */
export const POST = withAuth('opportunities', async (request) => {
  const opportunityId = request.url.split('/api/opportunities/')[1]?.split('/')[0];
  const body = await request.json();

  const scenario = await prisma.scenario.create({
    data: {
      opportunityId,
      name: body.name || 'Default Team',
      isDefault: body.is_default ?? false,
      fitScore: body.fit_score ?? null,
      burnoutImpact: body.burnout_impact ?? null,
      tentativeAssignments: {
        create: (body.tentative_assignments || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ta: any) => ({
            consultantId: ta.consultant_id,
            role: ta.role,
            startDate: new Date(ta.start_date),
            endDate: new Date(ta.end_date),
            allocationPercentage: ta.allocation_percentage ?? 100,
          })
        ),
      },
    },
    include: { tentativeAssignments: true },
  });

  return Response.json(toScenarioDTO(scenario), { status: 201 });
});
