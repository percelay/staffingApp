import { z } from 'zod';
import {
  ASSIGNMENT_ROLE_VALUES,
} from '@/lib/types/assignment';
import {
  CONSULTANT_STATUS_VALUES,
  PRACTICE_AREA_VALUES,
  SENIORITY_LEVEL_VALUES,
} from '@/lib/types/consultant';
import { ENGAGEMENT_STATUS_VALUES } from '@/lib/types/engagement';
import { PIPELINE_STAGE_VALUES } from '@/lib/types/opportunity';
import { SEVERITY_VALUES, SIGNAL_TYPE_VALUES } from '@/lib/types/wellbeing';

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const trimmedStringSchema = z.string().trim().min(1);

const stringListSchema = z
  .array(trimmedStringSchema)
  .transform((values) => [...new Set(values)]);

const nullableTrimmedStringSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

export const consultantCreateSchema = z.object({
  name: trimmedStringSchema,
  role: trimmedStringSchema,
  practice_area: z.enum(PRACTICE_AREA_VALUES),
  seniority_level: z.enum(SENIORITY_LEVEL_VALUES),
  avatar_url: z.string().trim().optional(),
  status: z.enum(CONSULTANT_STATUS_VALUES).optional(),
  skills: stringListSchema.default([]),
  goals: stringListSchema.default([]),
});

export const consultantUpdateSchema = z
  .object({
    name: trimmedStringSchema.optional(),
    role: trimmedStringSchema.optional(),
    practice_area: z.enum(PRACTICE_AREA_VALUES).optional(),
    seniority_level: z.enum(SENIORITY_LEVEL_VALUES).optional(),
    avatar_url: z.string().trim().optional(),
    status: z.enum(CONSULTANT_STATUS_VALUES).optional(),
  })
  .strict();

export const consultantSkillsSchema = z.object({
  skills: stringListSchema,
});

export const consultantGoalsSchema = z.object({
  goals: stringListSchema,
});

export const engagementCreateSchema = z.object({
  client_name: trimmedStringSchema,
  project_name: trimmedStringSchema,
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  required_skills: stringListSchema.default([]),
  status: z.enum(ENGAGEMENT_STATUS_VALUES).optional(),
  color: z.string().trim().optional(),
  is_bet: z.boolean().optional(),
});

export const engagementUpdateSchema = z
  .object({
    client_name: trimmedStringSchema.optional(),
    project_name: trimmedStringSchema.optional(),
    start_date: isoDateSchema.optional(),
    end_date: isoDateSchema.optional(),
    required_skills: stringListSchema.optional(),
    status: z.enum(ENGAGEMENT_STATUS_VALUES).optional(),
    color: z.string().trim().optional(),
    is_bet: z.boolean().optional(),
  })
  .strict();

export const assignmentCreateSchema = z.object({
  consultant_id: trimmedStringSchema,
  engagement_id: trimmedStringSchema,
  role: z.enum(ASSIGNMENT_ROLE_VALUES),
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  allocation_percentage: z.number().int().min(0).max(100).default(100),
  notes: nullableTrimmedStringSchema,
});

export const assignmentUpdateSchema = z
  .object({
    consultant_id: trimmedStringSchema.optional(),
    engagement_id: trimmedStringSchema.optional(),
    role: z.enum(ASSIGNMENT_ROLE_VALUES).optional(),
    start_date: isoDateSchema.optional(),
    end_date: isoDateSchema.optional(),
    allocation_percentage: z.number().int().min(0).max(100).optional(),
    notes: nullableTrimmedStringSchema,
  })
  .strict();

export const wellbeingSignalCreateSchema = z.object({
  consultant_id: trimmedStringSchema,
  signal_type: z.enum(SIGNAL_TYPE_VALUES),
  severity: z.enum(SEVERITY_VALUES),
  recorded_at: isoDateSchema.optional(),
  notes: nullableTrimmedStringSchema,
});

const tentativeAssignmentInputSchema = z.object({
  consultant_id: trimmedStringSchema,
  role: z.enum(ASSIGNMENT_ROLE_VALUES),
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  allocation_percentage: z.number().int().min(0).max(100).default(100),
});

const opportunityDefaultScenarioSchema = z.object({
  name: nullableTrimmedStringSchema.optional(),
  tentative_assignments: z.array(tentativeAssignmentInputSchema).default([]),
});

export const opportunityCreateSchema = z.object({
  client_name: trimmedStringSchema,
  project_name: trimmedStringSchema,
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  stage: z.enum(PIPELINE_STAGE_VALUES).optional(),
  probability: z.number().int().min(0).max(100).default(25),
  estimated_value: z.number().nullable().optional(),
  required_skills: stringListSchema.default([]),
  color: z.string().trim().optional(),
  is_bet: z.boolean().optional(),
  notes: nullableTrimmedStringSchema,
  converted_engagement_id: z.string().trim().nullable().optional(),
  default_scenario: opportunityDefaultScenarioSchema.nullable().optional(),
});

export const opportunityUpdateSchema = z
  .object({
    client_name: trimmedStringSchema.optional(),
    project_name: trimmedStringSchema.optional(),
    start_date: isoDateSchema.optional(),
    end_date: isoDateSchema.optional(),
    stage: z.enum(PIPELINE_STAGE_VALUES).optional(),
    probability: z.number().int().min(0).max(100).optional(),
    estimated_value: z.number().nullable().optional(),
    required_skills: stringListSchema.optional(),
    color: z.string().trim().optional(),
    is_bet: z.boolean().optional(),
    notes: nullableTrimmedStringSchema,
    converted_engagement_id: z.string().trim().nullable().optional(),
    default_scenario: opportunityDefaultScenarioSchema.nullable().optional(),
  })
  .strict();

export const tentativeAssignmentCreateSchema = tentativeAssignmentInputSchema;

export const tentativeAssignmentUpdateSchema = z
  .object({
    consultant_id: trimmedStringSchema.optional(),
    role: z.enum(ASSIGNMENT_ROLE_VALUES).optional(),
    start_date: isoDateSchema.optional(),
    end_date: isoDateSchema.optional(),
    allocation_percentage: z.number().int().min(0).max(100).optional(),
  })
  .strict();

export const scenarioCreateSchema = z.object({
  name: trimmedStringSchema.optional(),
  is_default: z.boolean().optional(),
  fit_score: z.number().int().nullable().optional(),
  burnout_impact: z.number().nullable().optional(),
  tentative_assignments: z.array(tentativeAssignmentInputSchema).default([]),
});

export const scenarioUpdateSchema = z
  .object({
    name: trimmedStringSchema.optional(),
    is_default: z.boolean().optional(),
    fit_score: z.number().int().nullable().optional(),
    burnout_impact: z.number().nullable().optional(),
    tentative_assignments: z.array(tentativeAssignmentInputSchema).optional(),
  })
  .strict();

export const proposalCreateSchema = z.object({
  engagement_id: trimmedStringSchema,
  fit_score: z.number(),
  burnout_risk: z.number(),
  slots: z
    .array(
      z.object({
        role: z.enum(ASSIGNMENT_ROLE_VALUES),
        consultant_id: z.string().trim().nullable(),
        required: z.boolean(),
      })
    )
    .default([]),
});

export type ConsultantCreateInput = z.infer<typeof consultantCreateSchema>;
export type ConsultantUpdateInput = z.infer<typeof consultantUpdateSchema>;
export type ConsultantSkillsInput = z.infer<typeof consultantSkillsSchema>;
export type ConsultantGoalsInput = z.infer<typeof consultantGoalsSchema>;
export type EngagementCreateInput = z.infer<typeof engagementCreateSchema>;
export type EngagementUpdateInput = z.infer<typeof engagementUpdateSchema>;
export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>;
export type WellbeingSignalCreateInput = z.infer<
  typeof wellbeingSignalCreateSchema
>;
export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
export type ScenarioCreateInput = z.infer<typeof scenarioCreateSchema>;
export type ScenarioUpdateInput = z.infer<typeof scenarioUpdateSchema>;
export type TentativeAssignmentCreateInput = z.infer<
  typeof tentativeAssignmentCreateSchema
>;
export type TentativeAssignmentUpdateInput = z.infer<
  typeof tentativeAssignmentUpdateSchema
>;
export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
