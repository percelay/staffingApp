import { normalizeEngagementStatus } from '@/lib/contracts/engagement';
import { assertFound } from '@/server/http';
import type {
  EngagementCreateInput,
  EngagementUpdateInput,
} from '@/server/schemas/engagements';
import {
  createEngagement,
  deleteEngagement,
  getEngagementById,
  listEngagements,
  updateEngagement,
} from '@/server/repositories/engagements-repository';
import { serializeEngagement } from '@/server/serializers/engagements';

export async function getEngagements(filters?: {
  status?: string | null;
}) {
  const records = await listEngagements({
    status: filters?.status ? normalizeEngagementStatus(filters.status) : null,
  });
  return records.map(serializeEngagement);
}

export async function getEngagement(id: string) {
  const record = await getEngagementById(id);
  return record ? serializeEngagement(record) : null;
}

export async function createEngagementFromInput(input: EngagementCreateInput) {
  const record = await createEngagement({
    clientName: input.client_name,
    projectName: input.project_name,
    startDate: new Date(input.start_date),
    endDate: new Date(input.end_date),
    status: input.status ? normalizeEngagementStatus(input.status) : 'upcoming',
    color: input.color || '#4F46E5',
    isBet: input.is_bet ?? false,
    requiredSkills: input.required_skills,
  });

  return serializeEngagement(record);
}

export async function updateEngagementFromInput(
  id: string,
  input: EngagementUpdateInput
) {
  assertFound(await getEngagementById(id), 'Engagement not found');
  const record = await updateEngagement(
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
      ...(input.status !== undefined
        ? { status: normalizeEngagementStatus(input.status) }
        : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.is_bet !== undefined ? { isBet: input.is_bet } : {}),
    },
    input.required_skills
  );

  return record ? serializeEngagement(record) : null;
}

export async function deleteEngagementById(id: string) {
  assertFound(await getEngagementById(id), 'Engagement not found');
  await deleteEngagement(id);
}
