import { z } from 'zod';

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const trimmedStringSchema = z.string().trim().min(1);

export const stringListSchema = z
  .array(trimmedStringSchema)
  .transform((values) => [...new Set(values)]);

export const nullableTrimmedStringSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();
