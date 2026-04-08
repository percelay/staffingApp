import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  notFoundResponse,
  parseRequestBody,
  successResponse,
} from '@/server/http';
import { scenarioUpdateSchema } from '@/server/schemas/scenarios';
import {
  deleteScenarioById,
  getScenarioForOpportunityById,
  updateScenarioFromInput,
} from '@/server/services/scenarios-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id/scenarios/:scenarioId
 */
export const GET = withAuth(
  'opportunities',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios/[scenarioId]'>
  ) => {
    const { id, scenarioId } = await ctx.params;
    const scenario = await getScenarioForOpportunityById(id, scenarioId);

    if (!scenario) {
      return notFoundResponse('Scenario not found');
    }

    return jsonResponse(scenario);
  }
);

/**
 * PUT /api/opportunities/:id/scenarios/:scenarioId
 * Replaces tentative assignments if provided.
 */
export const PUT = withAuth(
  'opportunities',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios/[scenarioId]'>
  ) => {
    try {
      const { id, scenarioId } = await ctx.params;
      const input = await parseRequestBody(request, scenarioUpdateSchema);
      const scenario = await updateScenarioFromInput(id, scenarioId, input);
      return jsonResponse(scenario);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

/**
 * DELETE /api/opportunities/:id/scenarios/:scenarioId
 */
export const DELETE = withAuth(
  'opportunities',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios/[scenarioId]'>
  ) => {
    const { id, scenarioId } = await ctx.params;
    await deleteScenarioById(id, scenarioId);
    return successResponse();
  }
);
