import { withAuth } from '@/lib/api/rbac';
import { jsonResponse } from '@/server/http';
import { getScenarios } from '@/server/services/scenarios-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/scenarios
 * Returns every opportunity scenario with tentative assignments for store hydration.
 */
export const GET = withAuth('opportunities', async () => {
  const scenarios = await getScenarios();
  return jsonResponse(scenarios);
});
