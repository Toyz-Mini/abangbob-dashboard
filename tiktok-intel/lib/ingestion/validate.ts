/**
 * Validation and normalization.
 *
 * Implements the layered validation of 02_DATA/DATA_VALIDATION_SPEC.md:
 *   file → schema → type → range → grain/key → date → currency →
 *   attribution → cross-field consistency → reconciliation.
 *
 * Layer 1 (file) runs in `parse.ts` before any content is read. Layer 10
 * (reconciliation) compares a source against the ratios it shipped, and against
 * other sources at analysis time.
 *
 * Every normalized row carries its provenance, because a metric without a
 * source, schema version and metric version has no defined meaning
 * (02_DATA/METRIC_SEMANTIC_GUARDRAILS.md).
 */

import { METRIC_VERSION } from '../contracts/versions'
import type { AdditiveMetric } from '../metrics/registry'
import type { MappingResult } from './mapping'
import { looksLikeFormula, type ParsedTable } from './parse'
import type { SourceDefinition } from './source-registry'

export type IssueSeverity = 'ERROR' | 'WARNING'

export interface ValidationIssue {
  layer:
    | 'SCHEMA'
    | 'TYPE'
    | 'RANGE'
    | 'GRAIN'
    | 'DATE'
    | 'CURRENCY'
    | 'ATTRIBUTION'
    | 'CROSS_FIELD'
    | 'RECONCILIATION'
    | 'CONTENT_SAFETY'
  severity: IssueSeverity
  /** 1-based row number as the user sees it in the file, or null for file-wide. */
  row: number | null
  column: string | null
  message: string
}

export interface NormalizedShopRow {
  business_date: string
  currency: string
  values: Partial<Record<AdditiveMetric, number>>
}

export interface NormalizedProductRow {
  product_key: string
  business_date: string
  currency: string
  values: Partial<Record<AdditiveMetric, number>>
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
  shopRows: NormalizedShopRow[]
  productRows: NormalizedProductRow[]
  summary: {
    rows_read: number
    rows_accepted: number
    rows_rejected: number
    date_min: string | null
    date_max: string | null
    currency: string
    errors: number
    warnings: number
  }
  provenance: {
    source_id: string
    source_schema_version: string
    metric_version: string
    grain: SourceDefinition['grain']
    provenance: SourceDefinition['provenance']
    caveats: string[]
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Accepts ISO dates and the two unambiguous slash forms. Nothing else. */
function parseDate(raw: string): string | null {
  const value = raw.trim()
  if (ISO_DATE.test(value)) {
    const timestamp = Date.parse(`${value}T00:00:00Z`)
    return Number.isNaN(timestamp) ? null : value
  }
  // YYYY/MM/DD — unambiguous because the year leads.
  const slash = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (slash) {
    const [, y, m, d] = slash
    const iso = `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
    return Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) ? null : iso
  }
  // Everything else (03/04/2025) is ambiguous between day-first and
  // month-first conventions and is refused rather than guessed.
  return null
}

function parseNumber(raw: string): number | null {
  const value = raw.trim().replace(/,/g, '')
  if (value === '') return null
  // Currency symbols and percent signs change the meaning of the number, so a
  // decorated value is a mapping problem rather than something to strip.
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/.test(value)) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function validateAndNormalize(
  table: ParsedTable,
  source: SourceDefinition,
  mapping: MappingResult,
  declaredCurrency: string,
): ValidationResult {
  const issues: ValidationIssue[] = []
  const shopRows: NormalizedShopRow[] = []
  const productRows: NormalizedProductRow[] = []

  const push = (issue: ValidationIssue) => issues.push(issue)

  // ── Layer 2 · schema ──────────────────────────────────────────────────
  if (mapping.missing_required.length > 0) {
    push({
      layer: 'SCHEMA',
      severity: 'ERROR',
      row: null,
      column: null,
      message: `Required columns are unmapped: ${mapping.missing_required.join(', ')}.`,
    })
  }
  if (mapping.ambiguous.length > 0) {
    push({
      layer: 'SCHEMA',
      severity: 'ERROR',
      row: null,
      column: null,
      message: `Columns matched more than one header and need confirmation: ${mapping.ambiguous.join(', ')}.`,
    })
  }
  for (const header of mapping.unrecognised_headers) {
    push({
      layer: 'SCHEMA',
      severity: 'WARNING',
      row: null,
      column: header,
      message: `Column "${header}" is not part of source ${source.source_id} and was not imported.`,
    })
  }

  if (mapping.missing_required.length > 0 || mapping.ambiguous.length > 0) {
    return finish(issues, [], [], table, source, declaredCurrency)
  }

  const indexOf = new Map(
    mapping.mappings
      .filter((m) => m.header_index !== null)
      .map((m) => [m.column_key, m.header_index!]),
  )
  const columnByKey = new Map(source.columns.map((c) => [c.key, c]))

  const dateIndex = indexOf.get(source.date_column)!
  const productKeyIndex = source.grain === 'PRODUCT_DAILY' ? indexOf.get('product_key') : undefined

  const seenKeys = new Set<string>()
  let accepted = 0
  let dateMin: string | null = null
  let dateMax: string | null = null

  table.rows.forEach((row, rowIndex) => {
    // Header occupies line 1, so data row 0 is line 2 to the user.
    const line = rowIndex + 2
    let rowHasError = false

    // ── Layer 6 · date ──────────────────────────────────────────────────
    const rawDate = row[dateIndex] ?? ''
    const businessDate = parseDate(rawDate)
    if (businessDate === null) {
      push({
        layer: 'DATE',
        severity: 'ERROR',
        row: line,
        column: source.date_column,
        message:
          rawDate.trim() === ''
            ? 'Date is empty.'
            : `Date "${rawDate}" is not an unambiguous date. Use YYYY-MM-DD.`,
      })
      rowHasError = true
    }

    // ── Layer 5 · grain / natural key ───────────────────────────────────
    let productKey: string | null = null
    if (source.grain === 'PRODUCT_DAILY') {
      productKey = (row[productKeyIndex!] ?? '').trim()
      if (productKey === '') {
        push({
          layer: 'GRAIN',
          severity: 'ERROR',
          row: line,
          column: 'product_key',
          message: 'Product key is empty; the row cannot be attributed to a product.',
        })
        rowHasError = true
      }
    }

    if (!rowHasError) {
      const naturalKey = productKey === null ? businessDate! : `${productKey}|${businessDate}`
      if (seenKeys.has(naturalKey)) {
        push({
          layer: 'GRAIN',
          severity: 'ERROR',
          row: line,
          column: null,
          message: `Duplicate row for ${naturalKey.replace('|', ' on ')}. The source declares one row per key.`,
        })
        rowHasError = true
      } else {
        seenKeys.add(naturalKey)
      }
    }

    // ── Layers 3, 4 · type and range ────────────────────────────────────
    const values: Partial<Record<AdditiveMetric, number>> = {}
    const sourceRatios: Record<string, number> = {}

    for (const [columnKey, headerIndex] of indexOf) {
      const column = columnByKey.get(columnKey)!
      if (column.type !== 'NUMBER') continue

      const raw = row[headerIndex] ?? ''

      if (looksLikeFormula(raw)) {
        push({
          layer: 'CONTENT_SAFETY',
          severity: 'ERROR',
          row: line,
          column: columnKey,
          message: `Cell contains a formula-like value ("${raw.slice(0, 32)}"). Formulas are never evaluated; export values only.`,
        })
        rowHasError = true
        continue
      }

      if (raw.trim() === '') {
        if (column.required) {
          push({
            layer: 'TYPE',
            severity: 'ERROR',
            row: line,
            column: columnKey,
            message: 'Required value is empty.',
          })
          rowHasError = true
        }
        // An optional blank stays absent rather than becoming zero.
        continue
      }

      const parsed = parseNumber(raw)
      if (parsed === null) {
        push({
          layer: 'TYPE',
          severity: 'ERROR',
          row: line,
          column: columnKey,
          message: `Value "${raw}" is not a plain number. Remove currency symbols, percent signs and thousands separators other than commas.`,
        })
        rowHasError = true
        continue
      }

      if (parsed < 0) {
        push({
          layer: 'RANGE',
          severity: 'ERROR',
          row: line,
          column: columnKey,
          message: `Value ${parsed} is negative. Counts, revenue and cost cannot be negative.`,
        })
        rowHasError = true
        continue
      }

      if (column.derived_in_source) {
        sourceRatios[columnKey] = parsed
        continue
      }
      if (column.maps_to) values[column.maps_to] = parsed
    }

    // ── Layer 9 · cross-field consistency ───────────────────────────────
    if (!rowHasError) {
      const stages: Array<[AdditiveMetric, AdditiveMetric]> = [
        ['product_views', 'add_to_cart'],
        ['add_to_cart', 'checkout'],
        ['checkout', 'orders'],
      ]
      for (const [upper, lower] of stages) {
        const upperValue = values[upper]
        const lowerValue = values[lower]
        if (upperValue !== undefined && lowerValue !== undefined && lowerValue > upperValue) {
          push({
            layer: 'CROSS_FIELD',
            severity: 'WARNING',
            row: line,
            column: lower,
            message: `${lower} (${lowerValue}) exceeds ${upper} (${upperValue}); the funnel stages are inconsistent for this day.`,
          })
        }
      }
    }

    // ── Layer 10 · reconciliation against source-provided ratios ────────
    if (!rowHasError) {
      reconcileRatio(
        sourceRatios.roi,
        values.gross_revenue,
        values.gmvmax_cost,
        'roi',
        line,
        push,
      )
      reconcileRatio(
        sourceRatios.cost_per_order,
        values.gmvmax_cost,
        values.gmvmax_orders,
        'cost_per_order',
        line,
        push,
      )
    }

    if (rowHasError) return

    accepted += 1
    if (dateMin === null || businessDate! < dateMin) dateMin = businessDate!
    if (dateMax === null || businessDate! > dateMax) dateMax = businessDate!

    if (source.grain === 'PRODUCT_DAILY') {
      productRows.push({
        product_key: productKey!,
        business_date: businessDate!,
        currency: declaredCurrency,
        values,
      })
    } else {
      shopRows.push({ business_date: businessDate!, currency: declaredCurrency, values })
    }
  })

  // ── Layer 7 · currency ────────────────────────────────────────────────
  if (source.currency !== declaredCurrency) {
    push({
      layer: 'CURRENCY',
      severity: 'WARNING',
      row: null,
      column: null,
      message: `The source is registered in ${source.currency} but the shop is configured as ${declaredCurrency}. Values are imported as ${declaredCurrency} without conversion.`,
    })
  }

  // ── Layer 8 · attribution ─────────────────────────────────────────────
  for (const caveat of source.caveats) {
    push({ layer: 'ATTRIBUTION', severity: 'WARNING', row: null, column: null, message: caveat })
  }

  if (accepted === 0) {
    push({
      layer: 'SCHEMA',
      severity: 'ERROR',
      row: null,
      column: null,
      message: 'No rows passed validation, so there is nothing to import.',
    })
  }

  return finish(issues, shopRows, productRows, table, source, declaredCurrency, dateMin, dateMax)
}

/**
 * Compares a ratio the export shipped against the same ratio recomputed from
 * its components. A mismatch means the source's definition differs from ours,
 * which is a definition conflict to surface, not a rounding detail to absorb.
 */
function reconcileRatio(
  reported: number | undefined,
  numerator: number | undefined,
  denominator: number | undefined,
  label: string,
  line: number,
  push: (issue: ValidationIssue) => void,
): void {
  if (reported === undefined || numerator === undefined || denominator === undefined) return
  if (denominator === 0) return

  const recomputed = numerator / denominator
  if (recomputed === 0 && reported === 0) return

  const relativeDifference = Math.abs(recomputed - reported) / Math.max(Math.abs(recomputed), 1e-9)
  if (relativeDifference > 0.01) {
    push({
      layer: 'RECONCILIATION',
      severity: 'WARNING',
      row: line,
      column: label,
      message: `Reported ${label} of ${reported} differs from ${recomputed.toFixed(4)} recomputed from its components (${(relativeDifference * 100).toFixed(1)}% apart). The source may define this ratio differently; the recomputed value is used.`,
    })
  }
}

function finish(
  issues: ValidationIssue[],
  shopRows: NormalizedShopRow[],
  productRows: NormalizedProductRow[],
  table: ParsedTable,
  source: SourceDefinition,
  currency: string,
  dateMin: string | null = null,
  dateMax: string | null = null,
): ValidationResult {
  const errors = issues.filter((i) => i.severity === 'ERROR').length
  const warnings = issues.length - errors
  const accepted = shopRows.length + productRows.length

  return {
    ok: errors === 0,
    issues,
    shopRows,
    productRows,
    summary: {
      rows_read: table.row_count,
      rows_accepted: accepted,
      rows_rejected: table.row_count - accepted,
      date_min: dateMin,
      date_max: dateMax,
      currency,
      errors,
      warnings,
    },
    provenance: {
      source_id: source.source_id,
      source_schema_version: source.schema_version,
      metric_version: METRIC_VERSION,
      grain: source.grain,
      provenance: source.provenance,
      caveats: source.caveats,
    },
  }
}
