import { prisma } from '@/lib/db';
import { toScenarioDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/scenarios
 * Returns every opportunity scenario with tentative assignments for store hydration.
 */
export const GET = withAuth('opportunities', async () => {
  const scenarios = await prisma.scenario.findMany({
    include: { tentativeAssignments: true },
    orderBy: [{ opportunityId: 'asc' }, { createdAt: 'asc' }],
  });

  return Response.json(scenarios.map(toScenarioDTO));
});
