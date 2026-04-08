import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { assignmentCreateSchema } from '@/server/schemas/staffing';
import {
  createAssignmentFromInput,
  getAssignments,
} from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assignments
 * Returns assignments, optionally filtered.
 * Query params: ?consultantId=xxx  &engagementId=xxx
 */
export const GET = withAuth('assignments', async (request) => {
  const { searchParams } = new URL(request.url);
  const consultantId = searchParams.get('consultantId');
  const engagementId = searchParams.get('engagementId');
  const assignments = await getAssignments({ consultantId, engagementId });
  return Response.json(assignments);
});

/**
 * POST /api/assignments
 * Assign a consultant to an engagement.
 * Body: { consultant_id, engagement_id, role, start_date, end_date, allocation_percentage }
 *
 * allocation_percentage controls how much utilization this project
 * uses. Examples:
 *   100 = full-time (5/5 days)
 *    80 = 4/5 days
 *    20 = 1/5 days
 *
 * Utilization is automatically computed as the sum of allocation_percentage
 * across all active assignments for a consultant.
 */
export const POST = withAuth('assignments', async (request) => {
  try {
    const input = await parseRequestBody(request, assignmentCreateSchema);
    const assignment = await createAssignmentFromInput(input);
    return Response.json(assignment, { status: 201 });
  } catch (err) {
    return createErrorResponse(err);
  }
});
