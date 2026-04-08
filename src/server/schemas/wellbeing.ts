import { z } from 'zod';
import {
  SEVERITY_VALUES,
  SIGNAL_TYPE_VALUES,
} from '@/lib/contracts/wellbeing';
import {
  isoDateSchema,
  nullableTrimmedStringSchema,
  trimmedStringSchema,
} from './shared';

export const wellbeingSignalCreateSchema = z.object({
  consultant_id: trimmedStringSchema,
  signal_type: z.enum(SIGNAL_TYPE_VALUES),
  severity: z.enum(SEVERITY_VALUES),
  recorded_at: isoDateSchema.optional(),
  notes: nullableTrimmedStringSchema,
});

export type WellbeingSignalCreateInput = z.infer<
  typeof wellbeingSignalCreateSchema
>;
