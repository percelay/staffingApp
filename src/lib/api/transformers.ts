/**
 * Data Transformation Layer
 *
 * Converts between Prisma's camelCase models (with nested relations)
 * and the flat, snake_case frontend interfaces that all components expect.
 *
 * This layer means ZERO component changes — stores receive the same shape.
 */

import type { Consultant } from '../types/consultant';
import {
  normalizeEngagementStatus,
  type Engagement,
} from '../types/engagement';
import type { Assignment } from '../types/assignment';
import type { WellbeingSignal } from '../types/wellbeing';
import {
  normalizePipelineStage,
  type Opportunity,
  type Scenario,
  type TentativeAssignment,
} from '../types/opportunity';

// ─── Prisma result types (what queries return) ──────────────

type PrismaConsultantWithSkills = {
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

type PrismaEngagementWithSkills = {
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

type PrismaAssignment = {
  id: string;
  consultantId: string;
  engagementId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
  notes?: string | null;
};

type PrismaWellbeingSignal = {
  id: string;
  consultantId: string;
  signalType: string;
  severity: string;
  recordedAt: Date;
};

// ─── Transformers ──────────────────────────────────────────

export function toConsultantDTO(p: PrismaConsultantWithSkills): Consultant {
  return {
    id: p.id,
    name: p.name,
    role: p.role,
    practice_area: p.practiceArea as Consultant['practice_area'],
    seniority_level: p.seniorityLevel as Consultant['seniority_level'],
    skills: p.skills.map((cs) => cs.skill.name),
    goals: p.goals.map((cg) => cg.skill.name),
    avatar_url: p.avatarUrl,
  };
}

export function toEngagementDTO(p: PrismaEngagementWithSkills): Engagement {
  return {
    id: p.id,
    client_name: p.clientName,
    project_name: p.projectName,
    start_date: formatDate(p.startDate),
    end_date: formatDate(p.endDate),
    required_skills: p.requiredSkills.map((es) => es.skill.name),
    status: normalizeEngagementStatus(p.status),
    color: p.color,
    is_bet: p.isBet,
  };
}

export function toAssignmentDTO(p: PrismaAssignment): Assignment {
  return {
    id: p.id,
    consultant_id: p.consultantId,
    engagement_id: p.engagementId,
    role: p.role as Assignment['role'],
    start_date: formatDate(p.startDate),
    end_date: formatDate(p.endDate),
    allocation_percentage: p.allocationPercentage,
  };
}

export function toWellbeingDTO(p: PrismaWellbeingSignal): WellbeingSignal {
  return {
    id: p.id,
    consultant_id: p.consultantId,
    signal_type: p.signalType as WellbeingSignal['signal_type'],
    severity: p.severity as WellbeingSignal['severity'],
    recorded_at: formatDate(p.recordedAt),
  };
}

// ─── Opportunity Transformers ─────────────────────────────

type PrismaOpportunityWithSkills = {
  id: string;
  clientName: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
  stage: string;
  probability: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  estimatedValue: any; // Prisma Decimal
  color: string;
  isBet: boolean;
  notes: string | null;
  convertedEngagementId: string | null;
  requiredSkills: Array<{
    skill: { id: string; name: string };
  }>;
};

type PrismaScenario = {
  id: string;
  opportunityId: string;
  name: string;
  isDefault: boolean;
  fitScore: number | null;
  burnoutImpact: number | null;
  tentativeAssignments?: PrismaTentativeAssignment[];
};

type PrismaTentativeAssignment = {
  id: string;
  scenarioId: string;
  consultantId: string;
  role: string;
  startDate: Date;
  endDate: Date;
  allocationPercentage: number;
};

export function toOpportunityDTO(p: PrismaOpportunityWithSkills): Opportunity {
  return {
    id: p.id,
    client_name: p.clientName,
    project_name: p.projectName,
    start_date: formatDate(p.startDate),
    end_date: formatDate(p.endDate),
    stage: normalizePipelineStage(p.stage),
    probability: p.probability,
    estimated_value: p.estimatedValue ? Number(p.estimatedValue) : null,
    required_skills: p.requiredSkills.map((os) => os.skill.name),
    color: p.color,
    is_bet: p.isBet,
    notes: p.notes,
    converted_engagement_id: p.convertedEngagementId,
  };
}

export function toScenarioDTO(p: PrismaScenario): Scenario {
  return {
    id: p.id,
    opportunity_id: p.opportunityId,
    name: p.name,
    is_default: p.isDefault,
    fit_score: p.fitScore,
    burnout_impact: p.burnoutImpact,
    tentative_assignments: (p.tentativeAssignments || []).map(
      toTentativeAssignmentDTO
    ),
  };
}

export function toTentativeAssignmentDTO(
  p: PrismaTentativeAssignment
): TentativeAssignment {
  return {
    id: p.id,
    scenario_id: p.scenarioId,
    consultant_id: p.consultantId,
    role: p.role as TentativeAssignment['role'],
    start_date: formatDate(p.startDate),
    end_date: formatDate(p.endDate),
    allocation_percentage: p.allocationPercentage,
  };
}

// ─── Helpers ───────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
