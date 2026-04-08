import {
  assertFound,
  NotFoundError,
} from '@/server/http';
import { getOpportunityById } from '@/server/repositories/opportunities-repository';
import {
  createScenario,
  createTentativeAssignment,
  deleteScenario,
  deleteTentativeAssignment,
  getScenarioForOpportunity,
  getTentativeAssignmentForScenario,
  listScenarios,
  updateScenario,
  updateTentativeAssignment,
} from '@/server/repositories/scenarios-repository';
import type {
  ScenarioCreateInput,
  ScenarioUpdateInput,
  TentativeAssignmentCreateInput,
  TentativeAssignmentUpdateInput,
} from '@/server/schemas/scenarios';
import {
  serializeScenario,
  serializeTentativeAssignment,
} from '@/server/serializers/scenarios';

export async function getScenarios(opportunityId?: string) {
  const records = await listScenarios(opportunityId);
  return records.map(serializeScenario);
}

export async function getScenarioForOpportunityById(
  opportunityId: string,
  scenarioId: string
) {
  const record = await getScenarioForOpportunity(opportunityId, scenarioId);
  return record ? serializeScenario(record) : null;
}

export async function createScenarioFromInput(
  opportunityId: string,
  input: ScenarioCreateInput
) {
  assertFound(
    await getOpportunityById(opportunityId),
    'Opportunity not found'
  );

  const record = await createScenario({
    opportunityId,
    name: input.name || 'Default Team',
    isDefault: input.is_default ?? false,
    fitScore: input.fit_score ?? null,
    burnoutImpact: input.burnout_impact ?? null,
    tentativeAssignments: input.tentative_assignments.map((assignment) => ({
      consultantId: assignment.consultant_id,
      role: assignment.role,
      startDate: new Date(assignment.start_date),
      endDate: new Date(assignment.end_date),
      allocationPercentage: assignment.allocation_percentage,
    })),
  });

  return serializeScenario(record);
}

export async function updateScenarioFromInput(
  opportunityId: string,
  scenarioId: string,
  input: ScenarioUpdateInput
) {
  assertFound(
    await getScenarioForOpportunity(opportunityId, scenarioId),
    'Scenario not found'
  );

  const record = await updateScenario(
    scenarioId,
    {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.is_default !== undefined
        ? { isDefault: input.is_default }
        : {}),
      ...(input.fit_score !== undefined ? { fitScore: input.fit_score } : {}),
      ...(input.burnout_impact !== undefined
        ? { burnoutImpact: input.burnout_impact }
        : {}),
    },
    input.tentative_assignments?.map((assignment) => ({
      consultantId: assignment.consultant_id,
      role: assignment.role,
      startDate: new Date(assignment.start_date),
      endDate: new Date(assignment.end_date),
      allocationPercentage: assignment.allocation_percentage,
    }))
  );

  return serializeScenario(
    assertFound(record, 'Scenario not found')
  );
}

export async function deleteScenarioById(
  opportunityId: string,
  scenarioId: string
) {
  assertFound(
    await getScenarioForOpportunity(opportunityId, scenarioId),
    'Scenario not found'
  );
  await deleteScenario(scenarioId);
}

export async function createTentativeAssignmentFromInput(
  opportunityId: string,
  scenarioId: string,
  input: TentativeAssignmentCreateInput
) {
  assertFound(
    await getScenarioForOpportunity(opportunityId, scenarioId),
    'Scenario not found'
  );

  const record = await createTentativeAssignment({
    scenarioId,
    consultantId: input.consultant_id,
    role: input.role,
    startDate: new Date(input.start_date),
    endDate: new Date(input.end_date),
    allocationPercentage: input.allocation_percentage,
  });

  return serializeTentativeAssignment(record);
}

export async function updateTentativeAssignmentFromInput(
  opportunityId: string,
  scenarioId: string,
  assignmentId: string,
  input: TentativeAssignmentUpdateInput
) {
  const existingAssignment = await getTentativeAssignmentForScenario(
    opportunityId,
    scenarioId,
    assignmentId
  );

  if (!existingAssignment) {
    throw new NotFoundError('Tentative assignment not found');
  }

  const record = await updateTentativeAssignment(assignmentId, {
    ...(input.consultant_id !== undefined
      ? { consultantId: input.consultant_id }
      : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.start_date !== undefined
      ? { startDate: new Date(input.start_date) }
      : {}),
    ...(input.end_date !== undefined ? { endDate: new Date(input.end_date) } : {}),
    ...(input.allocation_percentage !== undefined
      ? { allocationPercentage: input.allocation_percentage }
      : {}),
  });

  return serializeTentativeAssignment(record);
}

export async function deleteTentativeAssignmentById(
  opportunityId: string,
  scenarioId: string,
  assignmentId: string
) {
  assertFound(
    await getTentativeAssignmentForScenario(opportunityId, scenarioId, assignmentId),
    'Tentative assignment not found'
  );
  await deleteTentativeAssignment(assignmentId);
}
