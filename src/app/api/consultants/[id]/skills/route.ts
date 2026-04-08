import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  notFoundResponse,
  parseRequestBody,
} from '@/server/http';
import { consultantSkillsSchema } from '@/server/schemas/consultants';
import { replaceConsultantSkillsFromInput } from '@/server/services/consultants-service';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/consultants/:id/skills
 * Replace the entire skill set for a consultant.
 * Body: { skills: string[] }
 *
 * This is an atomic operation:
 *   1. Delete all existing consultant_skills
 *   2. Create new ones from the provided array
 *   3. Auto-creates skills that don't exist yet
 */
export const PUT = withAuth(
  'consultants',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/consultants/[id]/skills'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, consultantSkillsSchema);
      const consultant = await replaceConsultantSkillsFromInput(id, input);

      if (!consultant) {
        return notFoundResponse('Consultant not found');
      }

      return jsonResponse(consultant);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);
