import { z } from 'zod';
import { ASSIGNMENT_ROLE_VALUES } from '@/lib/contracts/assignment';
import {
  isoDateSchema,
  trimmedStringSchema,
} from './shared';

export const tentativeAssignmentInputSchema = z.object({
  consultant_id: trimmedStringSchema,
  role: z.enum(ASSIGNMENT_ROLE_VALUES),
  start_date: isoDateSchema,
  end_date: isoDateSchema,
  allocation_percentage: z.number().int().min(0).max(100).default(100),
});

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

export type ScenarioCreateInput = z.infer<typeof scenarioCreateSchema>;
export type ScenarioUpdateInput = z.infer<typeof scenarioUpdateSchema>;
export type TentativeAssignmentCreateInput = z.infer<
  typeof tentativeAssignmentCreateSchema
>;
export type TentativeAssignmentUpdateInput = z.infer<
  typeof tentativeAssignmentUpdateSchema
>;
