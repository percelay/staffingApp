import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { toAssignmentDTO } from '@/lib/api/transformers';

/**
 * PATCH /api/assignments/:id
 * Update assignment fields: allocation, dates, role, notes.
 * Body: partial Assignment fields in snake_case.
 *
 * Common use cases:
 *   - Change allocation: { allocation_percentage: 20 }  (1 out of 5 days)
 *   - Change timeline:   { start_date: "2026-04-01", end_date: "2026-06-01" }
 *   - Change role:       { role: "manager" }
 *   - Reassign:          { consultant_id: "new-id" }
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/assignments/[id]'>
) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (body.consultant_id !== undefined) data.consultantId = body.consultant_id;
    if (body.engagement_id !== undefined) data.engagementId = body.engagement_id;
    if (body.role !== undefined) data.role = body.role;
    if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
    if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
    if (body.allocation_percentage !== undefined) data.allocationPercentage = body.allocation_percentage;
    if (body.notes !== undefined) data.notes = body.notes;

    const assignment = await prisma.assignment.update({
      where: { id },
      data,
    });

    return Response.json(toAssignmentDTO(assignment));
  } catch (err) {
    console.error('[PATCH /api/assignments/:id]', err);
    return Response.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

/**
 * DELETE /api/assignments/:id
 * Remove a consultant from a project.
 * Their utilization automatically decreases.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/assignments/[id]'>
) {
  try {
    const { id } = await ctx.params;
    await prisma.assignment.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/assignments/:id]', err);
    return Response.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
