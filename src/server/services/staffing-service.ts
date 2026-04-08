import { OPPORTUNITY_COLOR_PALETTE } from '@/lib/constants/staffing';
import {
  CONSULTANT_STATUS_VALUES,
  PRACTICE_AREA_VALUES,
  type ConsultantStatus,
  type PracticeArea,
} from '@/lib/types/consultant';
import { normalizeEngagementStatus } from '@/lib/types/engagement';
import { normalizePipelineStage } from '@/lib/types/opportunity';
import type {
  AssignmentCreateInput,
  AssignmentUpdateInput,
  ConsultantCreateInput,
  ConsultantGoalsInput,
  ConsultantSkillsInput,
  ConsultantUpdateInput,
  EngagementCreateInput,
  EngagementUpdateInput,
  OpportunityCreateInput,
  OpportunityUpdateInput,
  ProposalCreateInput,
  ScenarioCreateInput,
  ScenarioUpdateInput,
  TentativeAssignmentCreateInput,
  TentativeAssignmentUpdateInput,
  WellbeingSignalCreateInput,
} from '@/server/schemas/staffing';
import {
  createAssignment,
  createConsultant,
  createEngagement,
  createOpportunity,
  createProposal,
  createScenario,
  createTentativeAssignment,
  createWellbeingSignal,
  deleteAssignment,
  deleteEngagement,
  deleteOpportunity,
  deleteScenario,
  deleteTentativeAssignment,
  getConsultantById,
  getEngagementById,
  getOpportunityById,
  getProposalById,
  getScenarioById,
  listAssignments,
  listConsultants,
  listEngagements,
  listOpportunities,
  listProposals,
  listScenarios,
  listSkills,
  listWellbeingSignals,
  replaceConsultantGoals,
  replaceConsultantSkills,
  softDeleteConsultant,
  updateAssignment,
  updateConsultant,
  updateEngagement,
  updateOpportunity,
  updateScenario,
  updateTentativeAssignment,
} from '@/server/repositories/staffing-repository';
import {
  serializeAssignment,
  serializeConsultant,
  serializeEngagement,
  serializeOpportunity,
  serializeProposal,
  serializeScenario,
  serializeTentativeAssignment,
  serializeWellbeingSignal,
} from '@/server/serializers/staffing';

export async function getConsultants(filters?: {
  status?: string | null;
  practiceArea?: string | null;
}) {
  const normalizedStatus =
    filters?.status === 'all'
      ? 'all'
      : CONSULTANT_STATUS_VALUES.includes(
            filters?.status as ConsultantStatus
          )
        ? (filters?.status as ConsultantStatus)
        : 'active';

  const normalizedPracticeArea = PRACTICE_AREA_VALUES.includes(
    filters?.practiceArea as PracticeArea
  )
    ? (filters?.practiceArea as PracticeArea)
    : null;

  const records = await listConsultants({
    status: normalizedStatus,
    practiceArea: normalizedPracticeArea,
  });
  return records.map(serializeConsultant);
}

export async function getConsultant(id: string) {
  const record = await getConsultantById(id);
  return record ? serializeConsultant(record) : null;
}

export async function createConsultantFromInput(input: ConsultantCreateInput) {
  const record = await createConsultant({
    name: input.name,
    role: input.role,
    practiceArea: input.practice_area,
    seniorityLevel: input.seniority_level,
    avatarUrl:
      input.avatar_url ||
      `https://api.dicebear.com/9.x/notionists/svg?seed=${Date.now()}`,
    status: input.status ?? 'active',
    skills: input.skills,
    goals: input.goals,
  });

  return serializeConsultant(record);
}

export async function updateConsultantFromInput(
  id: string,
  input: ConsultantUpdateInput
) {
  const record = await updateConsultant(id, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.practice_area !== undefined
      ? { practiceArea: input.practice_area }
      : {}),
    ...(input.seniority_level !== undefined
      ? { seniorityLevel: input.seniority_level }
      : {}),
    ...(input.avatar_url !== undefined ? { avatarUrl: input.avatar_url } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  });

  return serializeConsultant(record);
}

export async function deleteConsultantById(id: string) {
  const record = await softDeleteConsultant(id);
  return serializeConsultant(record);
}

export async function replaceConsultantSkillsFromInput(
  id: string,
  input: ConsultantSkillsInput
) {
  const record = await replaceConsultantSkills(id, input.skills);
  return record ? serializeConsultant(record) : null;
}

export async function replaceConsultantGoalsFromInput(
  id: string,
  input: ConsultantGoalsInput
) {
  const record = await replaceConsultantGoals(id, input.goals);
  return record ? serializeConsultant(record) : null;
}

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
  await deleteEngagement(id);
}

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
  await deleteAssignment(id);
}

export async function getWellbeingSignals(filters?: {
  consultantId?: string | null;
}) {
  const records = await listWellbeingSignals(filters);
  return records.map(serializeWellbeingSignal);
}

export async function createWellbeingSignalFromInput(
  input: WellbeingSignalCreateInput
) {
  const record = await createWellbeingSignal({
    consultantId: input.consultant_id,
    signalType: input.signal_type,
    severity: input.severity,
    recordedAt: input.recorded_at ? new Date(input.recorded_at) : new Date(),
    notes: input.notes ?? null,
  });

  return serializeWellbeingSignal(record);
}

export async function getSkills() {
  const records = await listSkills();
  return records.map((record) => record.name);
}

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
  await deleteOpportunity(id);
}

export async function getScenarios(opportunityId?: string) {
  const records = await listScenarios(opportunityId);
  return records.map(serializeScenario);
}

export async function getScenario(id: string) {
  const record = await getScenarioById(id);
  return record ? serializeScenario(record) : null;
}

export async function createScenarioFromInput(
  opportunityId: string,
  input: ScenarioCreateInput
) {
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
  id: string,
  input: ScenarioUpdateInput
) {
  const record = await updateScenario(
    id,
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

  return record ? serializeScenario(record) : null;
}

export async function deleteScenarioById(id: string) {
  await deleteScenario(id);
}

export async function createTentativeAssignmentFromInput(
  scenarioId: string,
  input: TentativeAssignmentCreateInput
) {
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
  id: string,
  input: TentativeAssignmentUpdateInput
) {
  const record = await updateTentativeAssignment(id, {
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

export async function deleteTentativeAssignmentById(id: string) {
  await deleteTentativeAssignment(id);
}

export async function getProposals() {
  const records = await listProposals();
  return records.map(serializeProposal);
}

export async function getProposal(id: string) {
  const record = await getProposalById(id);
  return record ? serializeProposal(record) : null;
}

export async function createProposalFromInput(input: ProposalCreateInput) {
  const record = await createProposal({
    engagementId: input.engagement_id,
    fitScore: input.fit_score,
    burnoutRisk: input.burnout_risk,
    slots: input.slots.map((slot) => ({
      role: slot.role,
      consultantId: slot.consultant_id,
      required: slot.required,
    })),
  });

  return serializeProposal(record);
}
