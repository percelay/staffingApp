import { z } from 'zod';
import {
  CONSULTANT_STATUS_VALUES,
  PRACTICE_AREA_VALUES,
  SENIORITY_LEVEL_VALUES,
} from '@/lib/contracts/consultant';
import {
  stringListSchema,
  trimmedStringSchema,
} from './shared';

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

export type ConsultantCreateInput = z.infer<typeof consultantCreateSchema>;
export type ConsultantUpdateInput = z.infer<typeof consultantUpdateSchema>;
export type ConsultantSkillsInput = z.infer<typeof consultantSkillsSchema>;
export type ConsultantGoalsInput = z.infer<typeof consultantGoalsSchema>;
