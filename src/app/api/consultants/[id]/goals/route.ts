import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { consultantGoalsSchema } from '@/server/schemas/staffing';
import { replaceConsultantGoalsFromInput } from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/consultants/:id/goals
 * Replace the entire goal set for a consultant.
 * Body: { goals: string[] }
 *
 * Goals are skills a consultant wants to learn/develop.
 * Each goal maps to an existing Skill record.
 */
export const PUT = withAuth(
  'consultants',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/consultants/[id]/goals'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, consultantGoalsSchema);
      const consultant = await replaceConsultantGoalsFromInput(id, input);

      if (!consultant) {
        return Response.json({ error: 'Consultant not found' }, { status: 404 });
      }

      return Response.json(consultant);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);
