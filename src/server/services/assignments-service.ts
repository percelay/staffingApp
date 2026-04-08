import type {
  AssignmentCreateInput,
  AssignmentUpdateInput,
} from '@/server/schemas/assignments';
import { assertFound } from '@/server/http';
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  listAssignments,
  updateAssignment,
} from '@/server/repositories/assignments-repository';
import { serializeAssignment } from '@/server/serializers/assignments';

export async function getAssignments(filters?: {
  consultantId?: string | null;
  engagementId?: string | null;
}) {
  const records = await listAssignments(filters);
  return records.map(serializeAssignment);
}

export async function createAssignmentFromInput(input: AssignmentCreateInput) {
  const record = await createAssignment({
    consultantId: input.consultant_id,
    engagementId: input.engagement_id,
    role: input.role,
    startDate: new Date(input.start_date),
    endDate: new Date(input.end_date),
    allocationPercentage: input.allocation_percentage,
    notes: input.notes ?? null,
  });

  return serializeAssignment(record);
}

export async function updateAssignmentFromInput(
  id: string,
  input: AssignmentUpdateInput
) {
  assertFound(await getAssignmentById(id), 'Assignment not found');
  const record = await updateAssignment(id, {
    ...(input.consultant_id !== undefined
      ? { consultantId: input.consultant_id }
      : {}),
    ...(input.engagement_id !== undefined
      ? { engagementId: input.engagement_id }
      : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.start_date !== undefined
      ? { startDate: new Date(input.start_date) }
      : {}),
    ...(input.end_date !== undefined ? { endDate: new Date(input.end_date) } : {}),
    ...(input.allocation_percentage !== undefined
      ? { allocationPercentage: input.allocation_percentage }
      : {}),
    ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
  });

  return serializeAssignment(record);
}

export async function deleteAssignmentById(id: string) {
  assertFound(await getAssignmentById(id), 'Assignment not found');
  await deleteAssignment(id);
}
