import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { opportunityUpdateSchema } from '@/server/schemas/staffing';
import {
  deleteOpportunityById,
  getOpportunity,
  updateOpportunityFromInput,
} from '@/server/services/staffing-service';

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
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return Response.json(opportunity);
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
        return Response.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      return Response.json(opportunity);
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
    return Response.json({ success: true });
  }
);
