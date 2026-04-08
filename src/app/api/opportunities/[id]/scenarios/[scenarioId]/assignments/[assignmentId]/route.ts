import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  parseRequestBody,
  successResponse,
} from '@/server/http';
import { tentativeAssignmentUpdateSchema } from '@/server/schemas/scenarios';
import {
  deleteTentativeAssignmentById,
  updateTentativeAssignmentFromInput,
} from '@/server/services/scenarios-service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/opportunities/:id/scenarios/:scenarioId/assignments/:assignmentId
 */
export const PATCH = withAuth(
  'opportunities',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios/[scenarioId]/assignments/[assignmentId]'>
    ) => {
    try {
      const { id, scenarioId, assignmentId } = await ctx.params;
      const input = await parseRequestBody(request, tentativeAssignmentUpdateSchema);
      const tentativeAssignment = await updateTentativeAssignmentFromInput(
        id,
        scenarioId,
        assignmentId,
        input
      );

      return jsonResponse(tentativeAssignment);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

/**
 * DELETE /api/opportunities/:id/scenarios/:scenarioId/assignments/:assignmentId
 */
export const DELETE = withAuth(
  'opportunities',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/opportunities/[id]/scenarios/[scenarioId]/assignments/[assignmentId]'>
  ) => {
    const { id, scenarioId, assignmentId } = await ctx.params;
    await deleteTentativeAssignmentById(id, scenarioId, assignmentId);

    return successResponse();
  }
);
