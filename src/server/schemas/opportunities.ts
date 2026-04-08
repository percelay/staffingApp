import { z } from 'zod';
import { PIPELINE_STAGE_VALUES } from '@/lib/contracts/opportunity';
import {
  isoDateSchema,
  nullableTrimmedStringSchema,
  stringListSchema,
  trimmedStringSchema,
} from './shared';
import { tentativeAssignmentInputSchema } from './scenarios';

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

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;
