import { z } from 'zod';
import { ASSIGNMENT_ROLE_VALUES } from '@/lib/contracts/assignment';
import { trimmedStringSchema } from './shared';

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

export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
