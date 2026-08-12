/**
 * Request schemas.
 *
 * Mirrors the request bodies in `openapi/openapi.v1.6.json`. `.strict()`
 * enforces the contract's `additionalProperties: false`, so an unexpected field
 * is refused rather than silently ignored.
 */

import { z } from 'zod'

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date (YYYY-MM-DD).')

export const createShopSchema = z
  .object({
    name: z.string().min(1).max(120),
    currency: z.string().min(3).max(3).default('MYR'),
    timezone: z.string().min(1).default('Asia/Kuala_Lumpur'),
  })
  .strict()

export const createUploadUrlSchema = z
  .object({
    shop_id: z.string().uuid(),
    filename: z.string().min(1).max(255),
    file_type: z.enum(['CSV', 'XLSX']),
    size_bytes: z.number().int().positive(),
  })
  .strict()

export const createImportSchema = z
  .object({
    shop_id: z.string().uuid(),
    source_id: z.string().min(1),
    source_schema_version: z.string().min(1),
    storage_key: z.string().min(1),
  })
  .strict()

export const confirmImportSchema = z
  .object({
    overrides: z
      .array(
        z
          .object({
            column_key: z.string().min(1),
            header_index: z.number().int().min(0).nullable(),
          })
          .strict(),
      )
      .default([]),
  })
  .strict()

export const createAnalysisSchema = z
  .object({
    shop_id: z.string().uuid(),
    period_start: isoDate,
    period_end: isoDate,
    comparison: z
      .object({
        type: z.enum(['PREVIOUS_EQUIVALENT_PERIOD', 'CUSTOM']),
        start: isoDate.optional(),
        end: isoDate.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((value) => value.period_end >= value.period_start, {
    message: 'period_end must not precede period_start.',
    path: ['period_end'],
  })
  .refine(
    (value) =>
      value.comparison?.type !== 'CUSTOM' ||
      (Boolean(value.comparison.start) && Boolean(value.comparison.end)),
    { message: 'A CUSTOM comparison requires both start and end.', path: ['comparison'] },
  )

export const createExperimentSchema = z
  .object({
    shop_id: z.string().uuid(),
    diagnosis_id: z.string().uuid().optional(),
    hypothesis: z.string().min(1),
    control: z.record(z.unknown()),
    variant: z.record(z.unknown()),
    target_metric: z.string().min(1),
    success_threshold: z.number().optional(),
    observation_start: isoDate.optional(),
    observation_end: isoDate.optional(),
  })
  .strict()

/** Formats a Zod failure into the `details` object the error envelope carries. */
export function zodDetails(error: z.ZodError): Record<string, unknown> {
  return {
    fields: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }
}
