import type { Consultant } from '@/lib/types/consultant';
import {
  normalizeEngagementStatus,
  type Engagement,
} from '@/lib/types/engagement';
import type { Assignment } from '@/lib/types/assignment';
import type { WellbeingSignal } from '@/lib/types/wellbeing';
import {
  normalizePipelineStage,
  type Opportunity,
  type Scenario,
  type TentativeAssignment,
} from '@/lib/types/opportunity';
import type { Proposal } from '@/lib/types/proposal';

type ConsultantRecord = {
  id: string;
  name: string;
  role: string;
  practiceArea: string;
  seniorityLevel: string;
  avatarUrl: string;
  status: string;
  skills: Array<{
    skill: { id: string; name: string };
  }>;
  goals: Array<{
    skill: { id: string; name: string };
  }>;
};

type EngagementRecord = {
  id: string;
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  status: string;
  color: string;
  isBet: boolean;
  requiredSkills: Array<{
    skill: { id: string; name: string };
  }>;
};

type AssignmentRecord = {
  id: string;
  consultantId: string;
  engagementId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
  notes?: string | null;
};

type WellbeingSignalRecord = {
  id: string;
  consultantId: string;
  signalType: string;
  severity: string;
  notes?: string | null;
  recordedAt: Date;
};

type OpportunityRecord = {
  id: string;
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  stage: string;
  probability: number;
  estimatedValue: { toString(): string } | null;
  color: string;
  isBet: boolean;
  notes: string | null;
  convertedEngagementId: string | null;
  requiredSkills: Array<{
    skill: { id: string; name: string };
  }>;
};

type TentativeAssignmentRecord = {
  id: string;
  scenarioId: string;
  consultantId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
};

type ScenarioRecord = {
  id: string;
  opportunityId: string;
  name: string;
  isDefault: boolean;
  fitScore: number | null;
  burnoutImpact: number | null;
  tentativeAssignments?: TentativeAssignmentRecord[];
};

type ProposalRecord = {
  id: string;
  engagementId: string;
  fitScore: number;
  burnoutRisk: number;
  createdAt: Date;
  slots: Array<{
    role: string;
    consultantId: string | null;
    required: boolean;
  }>;
};

export function serializeConsultant(record: ConsultantRecord): Consultant {
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    practice_area: record.practiceArea as Consultant['practice_area'],
    seniority_level: record.seniorityLevel as Consultant['seniority_level'],
    status: record.status as Consultant['status'],
    skills: record.skills.map((item) => item.skill.name),
    goals: record.goals.map((item) => item.skill.name),
    avatar_url: record.avatarUrl,
  };
}

export function serializeEngagement(record: EngagementRecord): Engagement {
  return {
    id: record.id,
    client_name: record.clientName,
    project_name: record.projectName,
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    required_skills: record.requiredSkills.map((item) => item.skill.name),
    status: normalizeEngagementStatus(record.status),
    color: record.color,
    is_bet: record.isBet,
  };
}

export function serializeAssignment(record: AssignmentRecord): Assignment {
  return {
    id: record.id,
    consultant_id: record.consultantId,
    engagement_id: record.engagementId,
    role: record.role as Assignment['role'],
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    allocation_percentage: record.allocationPercentage,
  };
}

export function serializeWellbeingSignal(
  record: WellbeingSignalRecord
): WellbeingSignal {
  return {
    id: record.id,
    consultant_id: record.consultantId,
    signal_type: record.signalType as WellbeingSignal['signal_type'],
    severity: record.severity as WellbeingSignal['severity'],
    recorded_at: formatDate(record.recordedAt),
  };
}

export function serializeOpportunity(record: OpportunityRecord): Opportunity {
  return {
    id: record.id,
    client_name: record.clientName,
    project_name: record.projectName,
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    stage: normalizePipelineStage(record.stage),
    probability: record.probability,
    estimated_value: record.estimatedValue
      ? Number(record.estimatedValue.toString())
      : null,
    required_skills: record.requiredSkills.map((item) => item.skill.name),
    color: record.color,
    is_bet: record.isBet,
    notes: record.notes,
    converted_engagement_id: record.convertedEngagementId,
  };
}

export function serializeScenario(record: ScenarioRecord): Scenario {
  return {
    id: record.id,
    opportunity_id: record.opportunityId,
    name: record.name,
    is_default: record.isDefault,
    fit_score: record.fitScore,
    burnout_impact: record.burnoutImpact,
    tentative_assignments: (record.tentativeAssignments ?? []).map(
      serializeTentativeAssignment
    ),
  };
}

export function serializeTentativeAssignment(
  record: TentativeAssignmentRecord
): TentativeAssignment {
  return {
    id: record.id,
    scenario_id: record.scenarioId,
    consultant_id: record.consultantId,
    role: record.role as TentativeAssignment['role'],
    start_date: formatDate(record.startDate),
    end_date: formatDate(record.endDate),
    allocation_percentage: record.allocationPercentage,
  };
}

export function serializeProposal(record: ProposalRecord): Proposal {
  return {
    id: record.id,
    engagement_id: record.engagementId,
    fit_score: record.fitScore,
    burnout_risk: record.burnoutRisk,
    created_at: record.createdAt.toISOString(),
    slots: record.slots.map((slot) => ({
      role: slot.role as Proposal['slots'][number]['role'],
      consultant_id: slot.consultantId,
      required: slot.required,
    })),
  };
}

function formatDate(value: Date): string {
  return value.toISOString().split('T')[0];
}
