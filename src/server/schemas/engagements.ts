import { z } from 'zod';
import { ENGAGEMENT_STATUS_VALUES } from '@/lib/contracts/engagement';
import {
  isoDateSchema,
  stringListSchema,
  trimmedStringSchema,
} from './shared';

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

export type EngagementCreateInput = z.infer<typeof engagementCreateSchema>;
export type EngagementUpdateInput = z.infer<typeof engagementUpdateSchema>;
