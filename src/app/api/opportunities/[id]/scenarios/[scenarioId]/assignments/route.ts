import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  createdResponse,
  parseRequestBody,
} from '@/server/http';
import { tentativeAssignmentCreateSchema } from '@/server/schemas/scenarios';
import { createTentativeAssignmentFromInput } from '@/server/services/scenarios-service';

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
      const { id, scenarioId } = await ctx.params;
      const input = await parseRequestBody(request, tentativeAssignmentCreateSchema);
      const tentativeAssignment = await createTentativeAssignmentFromInput(
        id,
        scenarioId,
        input
      );

      return createdResponse(tentativeAssignment);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);
