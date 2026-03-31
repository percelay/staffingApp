import { prisma } from '@/lib/db';
import { toScenarioDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id/scenarios/:scenarioId
 */
export const GET = withAuth('opportunities', async (request) => {
  const parts = request.url.split('/api/opportunities/')[1]?.split('/');
  const scenarioId = parts?.[2]?.split('?')[0];

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: { tentativeAssignments: true },
  });

  if (!scenario) {
    return Response.json({ error: 'Scenario not found' }, { status: 404 });
  }

  return Response.json(toScenarioDTO(scenario));
});

/**
 * PUT /api/opportunities/:id/scenarios/:scenarioId
 * Replaces tentative assignments if provided.
 */
export const PUT = withAuth('opportunities', async (request) => {
  const parts = request.url.split('/api/opportunities/')[1]?.split('/');
  const scenarioId = parts?.[2]?.split('?')[0];
  const body = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.is_default !== undefined) data.isDefault = body.is_default;
  if (body.fit_score !== undefined) data.fitScore = body.fit_score;
  if (body.burnout_impact !== undefined) data.burnoutImpact = body.burnout_impact;

  if (body.tentative_assignments) {
    await prisma.$transaction(async (tx) => {
      await tx.tentativeAssignment.deleteMany({ where: { scenarioId } });
      for (const ta of body.tentative_assignments) {
        await tx.tentativeAssignment.create({
          data: {
            scenarioId: scenarioId!,
            consultantId: ta.consultant_id,
            role: ta.role,
            startDate: new Date(ta.start_date),
            endDate: new Date(ta.end_date),
            allocationPercentage: ta.allocation_percentage ?? 100,
          },
        });
      }
      if (Object.keys(data).length > 0) {
        await tx.scenario.update({ where: { id: scenarioId }, data });
      }
    });
  } else if (Object.keys(data).length > 0) {
    await prisma.scenario.update({ where: { id: scenarioId }, data });
  }

  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: { tentativeAssignments: true },
  });

  return Response.json(toScenarioDTO(scenario!));
});

/**
 * DELETE /api/opportunities/:id/scenarios/:scenarioId
 */
export const DELETE = withAuth('opportunities', async (request) => {
  const parts = request.url.split('/api/opportunities/')[1]?.split('/');
  const scenarioId = parts?.[2]?.split('?')[0];

  await prisma.scenario.delete({ where: { id: scenarioId } });

  return Response.json({ success: true });
});
