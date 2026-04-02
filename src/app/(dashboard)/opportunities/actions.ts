'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { normalizePipelineStage, type Opportunity } from '@/lib/types/opportunity';

type CreateOpportunityInput = Omit<Opportunity, 'id'>;

export async function createOpportunityAndRedirect(
  input: CreateOpportunityInput
) {
  const opportunity = await prisma.opportunity.create({
    data: {
      clientName: input.client_name,
      projectName: input.project_name,
      startDate: new Date(input.start_date),
      endDate: new Date(input.end_date),
      stage: normalizePipelineStage(input.stage),
      probability: input.probability ?? 25,
      estimatedValue: input.estimated_value ?? null,
      color: input.color || '#6366F1',
      isBet: input.is_bet ?? false,
      notes: input.notes ?? null,
      convertedEngagementId: input.converted_engagement_id ?? null,
      requiredSkills: {
        create: input.required_skills.map((skillName) => ({
          skill: {
            connectOrCreate: {
              where: { name: skillName },
              create: { name: skillName },
            },
          },
        })),
      },
    },
  });

  revalidatePath('/opportunities');
  revalidatePath(`/opportunities/${opportunity.id}`);
  redirect(`/opportunities/${opportunity.id}`);
}
