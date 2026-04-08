import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { tentativeAssignmentUpdateSchema } from '@/server/schemas/staffing';
import {
  deleteTentativeAssignmentById,
  updateTentativeAssignmentFromInput,
} from '@/server/services/staffing-service';

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
      const { assignmentId } = await ctx.params;
      const input = await parseRequestBody(request, tentativeAssignmentUpdateSchema);
      const tentativeAssignment = await updateTentativeAssignmentFromInput(
        assignmentId,
        input
      );

      return Response.json(tentativeAssignment);
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
    const { assignmentId } = await ctx.params;
    await deleteTentativeAssignmentById(assignmentId);

    return Response.json({ success: true });
  }
);
