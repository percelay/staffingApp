import { z } from 'zod';
import { ASSIGNMENT_ROLE_VALUES } from '@/lib/contracts/assignment';
import {
  isoDateSchema,
  nullableTrimmedStringSchema,
  trimmedStringSchema,
} from './shared';

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

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>;
