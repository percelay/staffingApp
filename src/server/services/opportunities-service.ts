import { OPPORTUNITY_COLOR_PALETTE } from '@/lib/constants/staffing';
import { normalizePipelineStage } from '@/lib/contracts/opportunity';
import { assertFound } from '@/server/http';
import type {
  OpportunityCreateInput,
  OpportunityUpdateInput,
} from '@/server/schemas/opportunities';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunityById,
  listOpportunities,
  updateOpportunity,
} from '@/server/repositories/opportunities-repository';
import { serializeOpportunity } from '@/server/serializers/opportunities';

export async function getOpportunities(filters?: { stage?: string | null }) {
  const records = await listOpportunities({
    stage: filters?.stage ? normalizePipelineStage(filters.stage) : null,
  });
  return records.map(serializeOpportunity);
}

export async function getOpportunity(id: string) {
  const record = await getOpportunityById(id);
  return record ? serializeOpportunity(record) : null;
}

export async function createOpportunityFromInput(input: OpportunityCreateInput) {
  const record = await createOpportunity({
    clientName: input.client_name,
    projectName: input.project_name,
    startDate: new Date(input.start_date),
    endDate: new Date(input.end_date),
    stage: input.stage ? normalizePipelineStage(input.stage) : 'identified',
    probability: input.probability ?? 25,
    estimatedValue: input.estimated_value ?? null,
    color: input.color || OPPORTUNITY_COLOR_PALETTE[0],
    isBet: input.is_bet ?? false,
    notes: input.notes ?? null,
    convertedEngagementId: input.converted_engagement_id ?? null,
    requiredSkills: input.required_skills,
    defaultScenario:
      input.default_scenario === null
        ? undefined
        : {
            name: input.default_scenario?.name?.trim() || 'Primary Team',
            tentativeAssignments: (
              input.default_scenario?.tentative_assignments ?? []
            ).map((assignment) => ({
              consultantId: assignment.consultant_id,
              role: assignment.role,
              startDate: new Date(assignment.start_date),
              endDate: new Date(assignment.end_date),
              allocationPercentage: assignment.allocation_percentage,
            })),
          },
  });

  return serializeOpportunity(record);
}

export async function updateOpportunityFromInput(
  id: string,
  input: OpportunityUpdateInput
) {
  assertFound(await getOpportunityById(id), 'Opportunity not found');
  const record = await updateOpportunity(
    id,
    {
      ...(input.client_name !== undefined
        ? { clientName: input.client_name }
        : {}),
      ...(input.project_name !== undefined
        ? { projectName: input.project_name }
        : {}),
      ...(input.start_date !== undefined
        ? { startDate: new Date(input.start_date) }
        : {}),
      ...(input.end_date !== undefined
        ? { endDate: new Date(input.end_date) }
        : {}),
      ...(input.stage !== undefined
        ? { stage: normalizePipelineStage(input.stage) }
        : {}),
      ...(input.probability !== undefined
        ? { probability: input.probability }
        : {}),
      ...(input.estimated_value !== undefined
        ? { estimatedValue: input.estimated_value }
        : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.is_bet !== undefined ? { isBet: input.is_bet } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
      ...(input.converted_engagement_id !== undefined
        ? { convertedEngagementId: input.converted_engagement_id }
        : {}),
    },
    input.required_skills,
    input.default_scenario === undefined || input.default_scenario === null
      ? undefined
      : {
          name: input.default_scenario.name?.trim() || 'Primary Team',
          tentativeAssignments: input.default_scenario.tentative_assignments.map(
            (assignment) => ({
              consultantId: assignment.consultant_id,
              role: assignment.role,
              startDate: new Date(assignment.start_date),
              endDate: new Date(assignment.end_date),
              allocationPercentage: assignment.allocation_percentage,
            })
          ),
        }
  );

  return record ? serializeOpportunity(record) : null;
}

export async function deleteOpportunityById(id: string) {
  assertFound(await getOpportunityById(id), 'Opportunity not found');
  await deleteOpportunity(id);
}
