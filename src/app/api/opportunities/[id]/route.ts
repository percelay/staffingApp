import { prisma } from '@/lib/db';
import { toOpportunityDTO } from '@/lib/api/transformers';
import { withAuth } from '@/lib/api/rbac';
import { normalizePipelineStage } from '@/lib/types/opportunity';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opportunities/:id
 */
export const GET = withAuth(
  'opportunities',
  async (
    _request,
    _auth,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await context.params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: { requiredSkills: { include: { skill: true } } },
    });

    if (!opportunity) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return Response.json(toOpportunityDTO(opportunity));
  }
);

/**
 * PATCH /api/opportunities/:id
 */
export const PATCH = withAuth(
  'opportunities',
  async (
    request,
    _auth,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await context.params;
    const body = await request.json();
    const { required_skills, default_scenario } = body;

    const existing = await prisma.opportunity.findUnique({
      where: { id },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!existing) {
      return Response.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (required_skills !== undefined) {
        await tx.opportunitySkill.deleteMany({ where: { opportunityId: id } });
        for (const skillName of required_skills) {
          const skill = await tx.skill.upsert({
            where: { name: skillName },
            update: {},
            create: { name: skillName },
          });
          await tx.opportunitySkill.create({
            data: { opportunityId: id, skillId: skill.id },
          });
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      if (body.client_name !== undefined) data.clientName = body.client_name;
      if (body.project_name !== undefined) data.projectName = body.project_name;
      if (body.start_date !== undefined) data.startDate = new Date(body.start_date);
      if (body.end_date !== undefined) data.endDate = new Date(body.end_date);
      if (body.stage !== undefined) data.stage = normalizePipelineStage(body.stage);
      if (body.probability !== undefined) data.probability = body.probability;
      if (body.estimated_value !== undefined) data.estimatedValue = body.estimated_value;
      if (body.color !== undefined) data.color = body.color;
      if (body.is_bet !== undefined) data.isBet = body.is_bet;
      if (body.notes !== undefined) data.notes = body.notes;

      if (Object.keys(data).length > 0) {
        await tx.opportunity.update({ where: { id }, data });
      }

      if (default_scenario !== undefined) {
        const scenarioStartDate = body.start_date
          ? new Date(body.start_date)
          : existing.startDate;
        const scenarioEndDate = body.end_date
          ? new Date(body.end_date)
          : existing.endDate;
        const currentDefaultScenario = await tx.scenario.findFirst({
          where: { opportunityId: id, isDefault: true },
        });

        if (currentDefaultScenario) {
          await tx.tentativeAssignment.deleteMany({
            where: { scenarioId: currentDefaultScenario.id },
          });
          await tx.scenario.update({
            where: { id: currentDefaultScenario.id },
            data: {
              name:
                default_scenario?.name?.trim() || currentDefaultScenario.name,
              tentativeAssignments: {
                create: (default_scenario?.tentative_assignments ?? []).map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (assignment: any) => ({
                    consultantId: assignment.consultant_id,
                    role: assignment.role,
                    startDate: new Date(
                      assignment.start_date || scenarioStartDate
                    ),
                    endDate: new Date(assignment.end_date || scenarioEndDate),
                    allocationPercentage:
                      assignment.allocation_percentage ?? 100,
                  })
                ),
              },
            },
          });
        } else {
          await tx.scenario.create({
            data: {
              opportunityId: id,
              name: default_scenario?.name?.trim() || 'Primary Team',
              isDefault: true,
              tentativeAssignments: {
                create: (default_scenario?.tentative_assignments ?? []).map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (assignment: any) => ({
                    consultantId: assignment.consultant_id,
                    role: assignment.role,
                    startDate: new Date(
                      assignment.start_date || scenarioStartDate
                    ),
                    endDate: new Date(assignment.end_date || scenarioEndDate),
                    allocationPercentage:
                      assignment.allocation_percentage ?? 100,
                  })
                ),
              },
            },
          });
        }
      }
    });

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: { requiredSkills: { include: { skill: true } } },
    });

    return Response.json(toOpportunityDTO(opportunity!));
  }
);

/**
 * DELETE /api/opportunities/:id
 */
export const DELETE = withAuth(
  'opportunities',
  async (
    _request,
    _auth,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await context.params;

    await prisma.opportunity.delete({ where: { id } });

    return Response.json({ success: true });
  }
);
