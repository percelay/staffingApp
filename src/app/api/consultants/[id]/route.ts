import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { toConsultantDTO } from '@/lib/api/transformers';

/**
 * GET /api/consultants/:id
 * Returns a single consultant with skills.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/consultants/[id]'>
) {
  const { id } = await ctx.params;

  const consultant = await prisma.consultant.findUnique({
    where: { id },
    include: { skills: { include: { skill: true } } },
  });

  if (!consultant) {
    return Response.json({ error: 'Consultant not found' }, { status: 404 });
  }

  return Response.json(toConsultantDTO(consultant));
}

/**
 * PATCH /api/consultants/:id
 * Update consultant fields (name, role, seniority_level, practice_area, etc.)
 * Body: partial Consultant fields in snake_case
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<'/api/consultants/[id]'>
) {
  const { id } = await ctx.params;
  const body = await request.json();

  // Map snake_case input to camelCase Prisma fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role;
  if (body.seniority_level !== undefined) data.seniorityLevel = body.seniority_level;
  if (body.practice_area !== undefined) data.practiceArea = body.practice_area;
  if (body.avatar_url !== undefined) data.avatarUrl = body.avatar_url;
  if (body.status !== undefined) data.status = body.status;

  const consultant = await prisma.consultant.update({
    where: { id },
    data,
    include: { skills: { include: { skill: true } } },
  });

  return Response.json(toConsultantDTO(consultant));
}

/**
 * DELETE /api/consultants/:id
 * Soft-deletes a consultant (sets status to 'departed').
 * Historical assignment data is preserved.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/consultants/[id]'>
) {
  const { id } = await ctx.params;

  const consultant = await prisma.consultant.update({
    where: { id },
    data: { status: 'departed' },
    include: { skills: { include: { skill: true } } },
  });

  return Response.json(toConsultantDTO(consultant));
}
