import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  parseRequestBody,
  successResponse,
} from '@/server/http';
import { assignmentUpdateSchema } from '@/server/schemas/assignments';
import {
  deleteAssignmentById,
  updateAssignmentFromInput,
} from '@/server/services/assignments-service';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/assignments/:id
 * Update assignment fields: allocation, dates, role, notes.
 * Body: partial Assignment fields in snake_case.
 *
 * Common use cases:
 *   - Change allocation: { allocation_percentage: 20 }  (1 out of 5 days)
 *   - Change timeline:   { start_date: "2026-04-01", end_date: "2026-06-01" }
 *   - Change role:       { role: "manager" }
 *   - Reassign:          { consultant_id: "new-id" }
 */
export const PATCH = withAuth(
  'assignments',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/assignments/[id]'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, assignmentUpdateSchema);
      const assignment = await updateAssignmentFromInput(id, input);
      return jsonResponse(assignment);
    } catch (err) {
      return createErrorResponse(err);
    }
  }
);

/**
 * DELETE /api/assignments/:id
 * Remove a consultant from a project.
 * Their utilization automatically decreases.
 */
export const DELETE = withAuth(
  'assignments',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/assignments/[id]'>
  ) => {
    try {
      const { id } = await ctx.params;
      await deleteAssignmentById(id);
      return successResponse();
    } catch (err) {
      return createErrorResponse(err);
    }
  }
);
