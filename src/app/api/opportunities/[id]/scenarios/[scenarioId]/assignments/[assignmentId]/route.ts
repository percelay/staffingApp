import { prisma } from '@/lib/db';
import { toTentativeAssignmentDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/opportunities/:id/scenarios/:scenarioId/assignments/:assignmentId
 */
export const PATCH = withAuth(
  'opportunities',
  async (
    request,
    _auth,
    context: {
      params: Promise<{
        id: string;
        scenarioId: string;
        assignmentId: string;
      }>;
    }
  ) => {
    const { assignmentId } = await context.params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (body.consultant_id !== undefined) data.consultantId = body.consultant_id;
    if (body.role !== undefined) data.role = body.role;
    if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
    if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
    if (body.allocation_percentage !== undefined) {
      data.allocationPercentage = body.allocation_percentage;
    }

    const tentativeAssignment = await prisma.tentativeAssignment.update({
      where: { id: assignmentId },
      data,
    });

    return Response.json(toTentativeAssignmentDTO(tentativeAssignment));
  }
);

/**
 * DELETE /api/opportunities/:id/scenarios/:scenarioId/assignments/:assignmentId
 */
export const DELETE = withAuth(
  'opportunities',
  async (
    _request,
    _auth,
    context: {
      params: Promise<{
        id: string;
        scenarioId: string;
        assignmentId: string;
      }>;
    }
  ) => {
    const { assignmentId } = await context.params;

    await prisma.tentativeAssignment.delete({ where: { id: assignmentId } });

    return Response.json({ success: true });
  }
);
