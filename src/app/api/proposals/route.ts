import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/proposals
 * Returns all saved proposals with slots.
 */
export async function GET() {
  const proposals = await prisma.proposal.findMany({
    include: {
      slots: { orderBy: { sortOrder: 'asc' } },
      engagement: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform to frontend shape
  return Response.json(
    proposals.map((p) => ({
      id: p.id,
      engagement_id: p.engagementId,
      fit_score: p.fitScore,
      burnout_risk: p.burnoutRisk,
      created_at: p.createdAt.toISOString(),
      slots: p.slots.map((s) => ({
        role: s.role,
        consultant_id: s.consultantId,
        required: s.required,
      })),
    }))
  );
}

/**
 * POST /api/proposals
 * Save a staffing proposal.
 * Body: { engagement_id, fit_score, burnout_risk, slots: [{ role, consultant_id, required }] }
 */
export async function POST(request: Request) {
  const body = await request.json();

  const proposal = await prisma.proposal.create({
    data: {
      engagementId: body.engagement_id,
      fitScore: body.fit_score,
      burnoutRisk: body.burnout_risk,
      slots: {
        create: (body.slots || []).map(
          (s: { role: string; consultant_id: string | null; required: boolean }, i: number) => ({
            role: s.role,
            consultantId: s.consultant_id,
            required: s.required,
            sortOrder: i,
          })
        ),
      },
    },
    include: {
      slots: { orderBy: { sortOrder: 'asc' } },
    },
  });

  return Response.json(
    {
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
    },
    { status: 201 }
  );
}
