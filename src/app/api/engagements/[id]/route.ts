import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  notFoundResponse,
  parseRequestBody,
  successResponse,
} from '@/server/http';
import { engagementUpdateSchema } from '@/server/schemas/engagements';
import {
  deleteEngagementById,
  getEngagement,
  updateEngagementFromInput,
} from '@/server/services/engagements-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/engagements/:id
 * Returns a single engagement with required skills.
 */
export const GET = withAuth(
  'engagements',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/engagements/[id]'>
  ) => {
    const { id } = await ctx.params;
    const engagement = await getEngagement(id);

    if (!engagement) {
      return notFoundResponse('Engagement not found');
    }

    return jsonResponse(engagement);
  }
);

/**
 * PATCH /api/engagements/:id
 * Update engagement fields (timelines, status, skills, etc.)
 * Body: partial Engagement fields in snake_case.
 *       If required_skills is provided, it replaces the entire skill set.
 */
export const PATCH = withAuth(
  'engagements',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/engagements/[id]'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, engagementUpdateSchema);
      const engagement = await updateEngagementFromInput(id, input);

      if (!engagement) {
        return notFoundResponse('Engagement not found');
      }

      return jsonResponse(engagement);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

/**
 * DELETE /api/engagements/:id
 * Hard-deletes an engagement. Requires partner role.
 * Cascade deletes assignments, proposals, skills.
 */
export const DELETE = withAuth(
  'engagements',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/engagements/[id]'>
  ) => {
    const { id } = await ctx.params;
    await deleteEngagementById(id);
    return successResponse();
  }
);
