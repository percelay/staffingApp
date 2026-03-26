import { prisma } from '@/lib/db';
import { toAssignmentDTO } from '@/lib/api/transformers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assignments
 * Returns assignments, optionally filtered.
 * Query params: ?consultantId=xxx  &engagementId=xxx
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const consultantId = searchParams.get('consultantId');
  const engagementId = searchParams.get('engagementId');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (consultantId) where.consultantId = consultantId;
  if (engagementId) where.engagementId = engagementId;

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { startDate: 'asc' },
  });

  return Response.json(assignments.map(toAssignmentDTO));
}

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
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const assignment = await prisma.assignment.create({
      data: {
        consultantId: body.consultant_id,
        engagementId: body.engagement_id,
        role: body.role,
        startDate: new Date(body.start_date),
        endDate: new Date(body.end_date),
        allocationPercentage: body.allocation_percentage ?? 100,
        notes: body.notes || null,
      },
    });

    return Response.json(toAssignmentDTO(assignment), { status: 201 });
  } catch (err) {
    console.error('[POST /api/assignments]', err);
    return Response.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
