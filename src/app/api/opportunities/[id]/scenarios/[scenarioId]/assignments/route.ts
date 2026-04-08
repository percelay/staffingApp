import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { tentativeAssignmentCreateSchema } from '@/server/schemas/staffing';
import { createTentativeAssignmentFromInput } from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/opportunities/:id/scenarios/:scenarioId/assignments
 */
export const POST = withAuth(
  'opportunities',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios/[scenarioId]/assignments'>
  ) => {
    try {
      const { scenarioId } = await ctx.params;
      const input = await parseRequestBody(request, tentativeAssignmentCreateSchema);
      const tentativeAssignment = await createTentativeAssignmentFromInput(
        scenarioId,
        input
      );

      return Response.json(tentativeAssignment, { status: 201 });
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);
