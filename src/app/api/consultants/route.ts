import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { consultantCreateSchema } from '@/server/schemas/staffing';
import {
  createConsultantFromInput,
  getConsultants,
} from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consultants
 * Returns all active consultants with skills flattened to string[].
 * Query params: ?status=active|on_leave|departed (default: active)
 *               ?practiceArea=strategy|operations|digital|risk|people
 */
export const GET = withAuth('consultants', async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';
  const practiceArea = searchParams.get('practiceArea');
  const consultants = await getConsultants({
    status: status === 'all' ? 'all' : status,
    practiceArea,
  });
  return Response.json(consultants);
});

/**
 * POST /api/consultants
 * Create a new consultant. Requires partner role.
 * Body: { name, role, practice_area, seniority_level, skills: string[], avatar_url }
 */
export const POST = withAuth('consultants', async (request) => {
  try {
    const input = await parseRequestBody(request, consultantCreateSchema);
    const consultant = await createConsultantFromInput(input);
    return Response.json(consultant, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
});
