import { withAuth } from '@/lib/api/rbac';
import {
  createErrorResponse,
  createdResponse,
  jsonResponse,
  parseRequestBody,
} from '@/server/http';
import { engagementCreateSchema } from '@/server/schemas/engagements';
import {
  createEngagementFromInput,
  getEngagements,
} from '@/server/services/engagements-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/engagements
 * Returns all engagements with required skills flattened.
 * Query params: ?status=active|upcoming|completed
 */
export const GET = withAuth('engagements', async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const engagements = await getEngagements({ status });
  return jsonResponse(engagements);
});

/**
 * POST /api/engagements
 * Create a new engagement (project). Requires partner role.
 * Body: { client_name, project_name, start_date, end_date, status, color, required_skills: string[] }
 */
export const POST = withAuth('engagements', async (request) => {
  try {
    const input = await parseRequestBody(request, engagementCreateSchema);
    const engagement = await createEngagementFromInput(input);
    return createdResponse(engagement);
  } catch (error) {
    return createErrorResponse(error);
  }
});
