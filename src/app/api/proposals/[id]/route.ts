import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/proposals/:id
 * Returns a single proposal with slots.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<'/api/proposals/[id]'>
) {
  const { id } = await ctx.params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      slots: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!proposal) {
    return Response.json({ error: 'Proposal not found' }, { status: 404 });
  }

  return Response.json({
    id: proposal.id,
    engagement_id: proposal.engagementId,
    fit_score: proposal.fitScore,
    burnout_risk: proposal.burnoutRisk,
    created_at: proposal.createdAt.toISOString(),
    slots: proposal.slots.map((s) => ({
      role: s.role,
      consultant_id: s.consultantId,
      required: s.required,
    })),
  });
}
