import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/rbac';
import { getProposal } from '@/server/services/staffing-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/proposals/:id
 * Returns a single proposal with slots.
 */
export const GET = withAuth(
  'proposals',
  async (
    _request: NextRequest,
    _auth,
    ctx: RouteContext<'/api/proposals/[id]'>
  ) => {
    const { id } = await ctx.params;
    const proposal = await getProposal(id);

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return Response.json(proposal);
  }
);
