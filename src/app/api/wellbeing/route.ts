import { withAuth } from '@/lib/api/rbac';
import { createErrorResponse, parseRequestBody } from '@/server/http';
import { wellbeingSignalCreateSchema } from '@/server/schemas/staffing';
import {
  createWellbeingSignalFromInput,
  getWellbeingSignals,
} from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wellbeing
 * Returns all wellbeing signals, optionally filtered by consultant.
 * Query params: ?consultantId=xxx
 */
export const GET = withAuth('wellbeing', async (request) => {
  const { searchParams } = new URL(request.url);
  const consultantId = searchParams.get('consultantId');
  const signals = await getWellbeingSignals({ consultantId });
  return Response.json(signals);
});

/**
 * POST /api/wellbeing
 * Record a new wellbeing signal.
 * Body: { consultant_id, signal_type, severity, recorded_at?, notes? }
 */
export const POST = withAuth('wellbeing', async (request) => {
  try {
    const input = await parseRequestBody(request, wellbeingSignalCreateSchema);
    const signal = await createWellbeingSignalFromInput(input);
    return Response.json(signal, { status: 201 });
  } catch (error) {
    return createErrorResponse(error);
  }
});
