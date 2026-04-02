import { prisma } from '@/lib/db';
import { toTentativeAssignmentDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/opportunities/:id/scenarios/:scenarioId/assignments
 */
export const POST = withAuth(
  'opportunities',
  async (
    request,
    _auth,
    context: { params: Promise<{ id: string; scenarioId: string }> }
  ) => {
    const { scenarioId } = await context.params;
    const body = await request.json();

    const tentativeAssignment = await prisma.tentativeAssignment.create({
      data: {
        scenarioId,
        consultantId: body.consultant_id,
        role: body.role,
        startDate: new Date(body.start_date),
        endDate: new Date(body.end_date),
        allocationPercentage: body.allocation_percentage ?? 100,
      },
    });

    return Response.json(toTentativeAssignmentDTO(tentativeAssignment), {
      status: 201,
    });
  }
);
