import { prisma } from '@/lib/db';
import { toWellbeingDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/wellbeing
 * Returns all wellbeing signals, optionally filtered by consultant.
 * Query params: ?consultantId=xxx
 */
export const GET = withAuth('wellbeing', async (request) => {
  const { searchParams } = new URL(request.url);
  const consultantId = searchParams.get('consultantId');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (consultantId) where.consultantId = consultantId;

  const signals = await prisma.wellbeingSignal.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
  });

  return Response.json(signals.map(toWellbeingDTO));
});

/**
 * POST /api/wellbeing
 * Record a new wellbeing signal.
 * Body: { consultant_id, signal_type, severity, recorded_at?, notes? }
 */
export const POST = withAuth('wellbeing', async (request) => {
  const body = await request.json();

  const signal = await prisma.wellbeingSignal.create({
    data: {
      consultantId: body.consultant_id,
      signalType: body.signal_type,
      severity: body.severity,
      recordedAt: body.recorded_at ? new Date(body.recorded_at) : new Date(),
      notes: body.notes || null,
    },
  });

  return Response.json(toWellbeingDTO(signal), { status: 201 });
});
