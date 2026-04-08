import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { opportunityCreateSchema } from '@/server/schemas/staffing';
import {
  createOpportunityFromInput,
  getOpportunities,
} from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities
 * Returns all opportunities with required skills flattened.
 * Query params: ?stage=identified|qualifying|proposal_sent|verbal_commit|won|lost
 */
export const GET = withAuth('opportunities', async (request) => {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage');
  const opportunities = await getOpportunities({ stage });
  return Response.json(opportunities);
});

/**
 * POST /api/opportunities
 * Create a new opportunity.
 * Body: { client_name, project_name, start_date, end_date, stage, probability,
 *         estimated_value, color, notes, required_skills: string[] }
 */
export const POST = withAuth('opportunities', async (request) => {
  try {
    const input = await parseRequestBody(request, opportunityCreateSchema);
    const opportunity = await createOpportunityFromInput(input);
    return Response.json(opportunity, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
});
