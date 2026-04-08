import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  jsonResponse,
  notFoundResponse,
  parseRequestBody,
} from '@/server/http';
import { consultantUpdateSchema } from '@/server/schemas/consultants';
import {
  deleteConsultantById,
  getConsultant,
  updateConsultantFromInput,
} from '@/server/services/consultants-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consultants/:id
 * Returns a single consultant with skills.
 */
export const GET = withAuth(
  'consultants',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/consultants/[id]'>
  ) => {
    const { id } = await ctx.params;
    const consultant = await getConsultant(id);

    if (!consultant) {
      return notFoundResponse('Consultant not found');
    }

    return jsonResponse(consultant);
  }
);

/**
 * PATCH /api/consultants/:id
 * Update consultant fields (name, role, seniority_level, practice_area, etc.)
 * Body: partial Consultant fields in snake_case
 */
export const PATCH = withAuth(
  'consultants',
  async (
    request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/consultants/[id]'>
  ) => {
    try {
      const { id } = await ctx.params;
      const input = await parseRequestBody(request, consultantUpdateSchema);
      const consultant = await updateConsultantFromInput(id, input);
      return jsonResponse(consultant);
    } catch (error) {
      return createErrorResponse(error);
    }
  }
);

/**
 * DELETE /api/consultants/:id
 * Soft-deletes a consultant (sets status to 'departed'). Requires partner role.
 * Historical assignment data is preserved.
 */
export const DELETE = withAuth(
  'consultants',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/consultants/[id]'>
  ) => {
    const { id } = await ctx.params;
    const consultant = await deleteConsultantById(id);
    return jsonResponse(consultant);
  }
);
