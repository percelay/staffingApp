import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { scenarioCreateSchema } from '@/server/schemas/staffing';
import {
  createScenarioFromInput,
  getScenarios,
} from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id/scenarios
 */
export const GET = withAuth(
  'opportunities',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios'>
  ) => {
    const { id } = await ctx.params;
    const scenarios = await getScenarios(id);
    return Response.json(scenarios);
  }
);

/**
 * POST /api/opportunities/:id/scenarios
 * Body: { name, is_default?, tentative_assignments?: [...] }
 */
export const POST = withAuth(
  'opportunities',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, scenarioCreateSchema);
      const scenario = await createScenarioFromInput(id, input);
      return Response.json(scenario, { status: 201 });
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);
