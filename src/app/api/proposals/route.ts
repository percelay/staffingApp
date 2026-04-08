import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { proposalCreateSchema } from '@/server/schemas/staffing';
import {
  createProposalFromInput,
  getProposals,
} from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/proposals
 * Returns all saved proposals with slots.
 */
export const GET = withAuth('proposals', async () => {
  const proposals = await getProposals();
  return Response.json(proposals);
});

/**
 * POST /api/proposals
 * Save a staffing proposal.
 * Body: { engagement_id, fit_score, burnout_risk, slots: [{ role, consultant_id, required }] }
 */
export const POST = withAuth('proposals', async (request) => {
  try {
    const input = await parseRequestBody(request, proposalCreateSchema);
    const proposal = await createProposalFromInput(input);
    return Response.json(proposal, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
});
