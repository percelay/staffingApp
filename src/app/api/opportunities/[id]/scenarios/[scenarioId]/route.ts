import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { scenarioUpdateSchema } from '@/server/schemas/staffing';
import {
  deleteScenarioById,
  getScenario,
  updateScenarioFromInput,
} from '@/server/services/staffing-service';

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
    const { scenarioId } = await ctx.params;
    const scenario = await getScenario(scenarioId);

    if (!scenario) {
      return Response.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return Response.json(scenario);
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
      const { scenarioId } = await ctx.params;
      const input = await parseRequestBody(request, scenarioUpdateSchema);
      const scenario = await updateScenarioFromInput(scenarioId, input);

      if (!scenario) {
        return Response.json({ error: 'Scenario not found' }, { status: 404 });
      }

      return Response.json(scenario);
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
    const { scenarioId } = await ctx.params;
    await deleteScenarioById(scenarioId);
    return Response.json({ success: true });
  }
);
