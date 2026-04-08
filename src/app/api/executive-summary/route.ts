import { withAuth } from '@/lib/api/rbac';
import { getExecutiveSummary } from '@/server/services/executive-summary-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/executive-summary
 * Partner-only endpoint. Returns aggregated executive metrics computed
 * from the database: current KPIs, 12-week trends, practice area breakdown,
 * engagement portfolio, and at-risk consultants.
 */
export const GET = withAuth('executive_summary', async () => {
  const summary = await getExecutiveSummary();
  return Response.json(summary);
});
