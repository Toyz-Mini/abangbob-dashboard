/**
 * Import orchestration.
 *
 * Drives the lifecycle in 04_TECHNICAL/UPLOAD_STORAGE_STATE_MACHINE.md from
 * UPLOADED through PARSING, VALIDATING and READY, persisting the mapping,
 * validation issues, provenance and normalized rows along the way.
 *
 * The file is hashed server-side and the hash is unique per (shop, sha256), so
 * uploading the same export twice is caught rather than double-counted.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { METRIC_VERSION } from '../contracts/versions'
import { autoMap, applyOverrides, toTemplateJson, type MappingResult } from './mapping'
import { assertAllowedFile, parseTable, type FileType, type ParsedTable } from './parse'
import { resolveSource, type SourceDefinition } from './source-registry'
import { validateAndNormalize, type ValidationResult } from './validate'

export const UPLOAD_BUCKET = 'imports'

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface DownloadedFile {
  bytes: ArrayBuffer
  fileType: FileType
  sizeBytes: number
  sha256: string
}

export async function downloadUpload(
  db: SupabaseClient,
  storageKey: string,
  filename: string,
): Promise<DownloadedFile> {
  const { data, error } = await db.storage.from(UPLOAD_BUCKET).download(storageKey)
  if (error || !data) {
    throw new Error(`The uploaded file could not be read from storage: ${error?.message ?? 'not found'}`)
  }

  const bytes = await data.arrayBuffer()
  // Size and type are re-checked against the actual object, not the values the
  // client declared when it asked for the upload URL.
  const fileType = assertAllowedFile(filename, bytes.byteLength)

  return {
    bytes,
    fileType,
    sizeBytes: bytes.byteLength,
    sha256: await sha256Hex(bytes),
  }
}

export function parseUpload(file: DownloadedFile): ParsedTable {
  const content =
    file.fileType === 'CSV' ? new TextDecoder('utf-8').decode(file.bytes) : file.bytes
  return parseTable(file.fileType, content)
}

export interface ImportPreparation {
  source: SourceDefinition
  table: ParsedTable
  mapping: MappingResult
  validation: ValidationResult | null
  /** Import status implied by the preparation outcome. */
  status: 'MAPPING_REQUIRED' | 'READY' | 'FAILED'
}

/**
 * Parses, maps and — when the mapping is unambiguous — validates an upload.
 *
 * An import that needs a human decision stops at MAPPING_REQUIRED instead of
 * choosing a column for the user (02_DATA/DATA_MAPPING_SPEC.md).
 */
export function prepareImport(
  file: DownloadedFile,
  sourceId: string,
  schemaVersion: string,
  currency: string,
  overrides: Array<{ column_key: string; header_index: number | null }> = [],
): ImportPreparation {
  const source = resolveSource(sourceId, schemaVersion)
  const table = parseUpload(file)

  let mapping = autoMap(source, table.headers)
  if (overrides.length > 0) {
    mapping = applyOverrides(mapping, source, table.headers, overrides)
  }

  if (mapping.requires_confirmation) {
    return { source, table, mapping, validation: null, status: 'MAPPING_REQUIRED' }
  }

  const validation = validateAndNormalize(table, source, mapping, currency)
  return {
    source,
    table,
    mapping: { ...mapping, state: validation.ok ? 'VALIDATED' : mapping.state },
    validation,
    status: validation.ok ? 'READY' : 'FAILED',
  }
}

/** Persists validation issues for the import detail screen (Screen 09). */
export async function persistIssues(
  db: SupabaseClient,
  importId: string,
  validation: ValidationResult,
): Promise<void> {
  // Bounded so a file with hundreds of thousands of bad rows cannot blow up the
  // table or the detail view. The summary counts remain complete.
  const MAX_PERSISTED_ISSUES = 500
  const issues = validation.issues.slice(0, MAX_PERSISTED_ISSUES)
  if (issues.length === 0) return

  const { error } = await db.from('import_validation_issues').insert(
    issues.map((issue) => ({
      import_id: importId,
      layer: issue.layer,
      severity: issue.severity,
      row_number: issue.row,
      column_name: issue.column,
      message: issue.message,
    })),
  )
  if (error) throw new Error(error.message)
}

/** Writes normalized rows for a READY import. */
export async function persistNormalizedRows(
  db: SupabaseClient,
  params: {
    workspaceId: string
    shopId: string
    importId: string
    currency: string
  },
  validation: ValidationResult,
): Promise<{ shop_rows: number; product_rows: number }> {
  const shopRows = validation.shopRows.map((row) => ({
    workspace_id: params.workspaceId,
    shop_id: params.shopId,
    business_date: row.business_date,
    currency: params.currency,
    // Additive counters default to 0 in the contracted schema and are NOT
    // NULL; nullable columns stay null so an absent metric stays absent.
    traffic: row.values.traffic ?? 0,
    product_views: row.values.product_views ?? 0,
    add_to_cart: row.values.add_to_cart ?? 0,
    checkout: row.values.checkout ?? 0,
    orders: row.values.orders ?? 0,
    gmv: row.values.gmv ?? 0,
    spend: row.values.spend ?? 0,
    gross_revenue: row.values.gross_revenue ?? null,
    paid_gmv: row.values.paid_gmv ?? null,
    organic_gmv: row.values.organic_gmv ?? null,
    live_gmv: row.values.live_gmv ?? null,
    affiliate_gmv: row.values.affiliate_gmv ?? null,
    gmvmax_cost: row.values.gmvmax_cost ?? null,
    gmvmax_orders: row.values.gmvmax_orders ?? null,
    source_import_id: params.importId,
    metric_version: METRIC_VERSION,
  }))

  const productRows = validation.productRows.map((row) => ({
    workspace_id: params.workspaceId,
    shop_id: params.shopId,
    product_key: row.product_key,
    business_date: row.business_date,
    currency: params.currency,
    product_views: row.values.product_views ?? null,
    add_to_cart: row.values.add_to_cart ?? null,
    orders: row.values.orders ?? null,
    gmv: row.values.gmv ?? null,
    spend: row.values.spend ?? null,
    source_import_id: params.importId,
    metric_version: METRIC_VERSION,
  }))

  const CHUNK = 500
  for (let i = 0; i < shopRows.length; i += CHUNK) {
    const { error } = await db.from('normalized_daily_metrics').insert(shopRows.slice(i, i + CHUNK))
    if (error) throw new Error(error.message)
  }
  for (let i = 0; i < productRows.length; i += CHUNK) {
    const { error } = await db
      .from('normalized_product_metrics')
      .insert(productRows.slice(i, i + CHUNK))
    if (error) throw new Error(error.message)
  }

  return { shop_rows: shopRows.length, product_rows: productRows.length }
}

export function mappingSummary(preparation: ImportPreparation): Record<string, unknown> {
  return {
    ...toTemplateJson(preparation.mapping),
    state: preparation.mapping.state,
    unrecognised_headers: preparation.mapping.unrecognised_headers,
    missing_required: preparation.mapping.missing_required,
    ambiguous: preparation.mapping.ambiguous,
    headers: preparation.table.headers,
  }
}
