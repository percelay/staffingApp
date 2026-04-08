import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  notFoundResponse,
  parseRequestBody,
  successResponse,
} from '@/server/http';
import { opportunityUpdateSchema } from '@/server/schemas/opportunities';
import {
  deleteOpportunityById,
  getOpportunity,
  updateOpportunityFromInput,
} from '@/server/services/opportunities-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id
 */
export const GET = withAuth(
  'opportunities',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]'>
  ) => {
    const { id } = await ctx.params;
    const opportunity = await getOpportunity(id);

    if (!opportunity) {
      return notFoundResponse('Opportunity not found');
    }

    return jsonResponse(opportunity);
  }
);

/**
 * PATCH /api/opportunities/:id
 */
export const PATCH = withAuth(
  'opportunities',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, opportunityUpdateSchema);
      const opportunity = await updateOpportunityFromInput(id, input);

      if (!opportunity) {
        return notFoundResponse('Opportunity not found');
      }

      return jsonResponse(opportunity);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

/**
 * DELETE /api/opportunities/:id
 */
export const DELETE = withAuth(
  'opportunities',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]'>
  ) => {
    const { id } = await ctx.params;
    await deleteOpportunityById(id);
    return successResponse();
  }
);
