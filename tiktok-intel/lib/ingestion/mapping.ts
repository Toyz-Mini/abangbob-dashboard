/**
 * Column mapping.
 *
 * States per 02_DATA/DATA_MAPPING_SPEC.md: AUTO_MAPPED → USER_CONFIRMED →
 * VALIDATED. Ambiguous mappings require confirmation; nothing is guessed.
 * A manual override changes only this import's mapping — it never alters a
 * canonical metric definition.
 */

import type { ColumnSpec, SourceDefinition } from './source-registry'

export type MappingState = 'AUTO_MAPPED' | 'USER_CONFIRMED' | 'VALIDATED'

export interface ColumnMapping {
  /** Canonical column key from the source definition. */
  column_key: string
  /** Header index in the uploaded file, or null when unmapped. */
  header_index: number | null
  header_name: string | null
  required: boolean
  /** How the mapping was arrived at. */
  origin: 'AUTO' | 'MANUAL' | 'UNMAPPED'
  /** Headers that matched this column, when more than one did. */
  ambiguous_candidates: string[]
}

export interface MappingResult {
  state: MappingState
  source_id: string
  source_schema_version: string
  mappings: ColumnMapping[]
  /** Headers in the file that no column claimed. Reported, never guessed at. */
  unrecognised_headers: string[]
  /** Required columns with no mapping. Blocks confirmation. */
  missing_required: string[]
  /** Columns matched by more than one header. Blocks confirmation. */
  ambiguous: string[]
  requires_confirmation: boolean
}

const normalise = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s\-.]+/g, '_')

function matchColumn(
  column: ColumnSpec,
  headers: string[],
): { indices: number[]; names: string[] } {
  const aliases = new Set(column.aliases.map(normalise))
  const indices: number[] = []
  const names: string[] = []
  headers.forEach((header, index) => {
    if (aliases.has(normalise(header))) {
      indices.push(index)
      names.push(header)
    }
  })
  return { indices, names }
}

export function autoMap(source: SourceDefinition, headers: string[]): MappingResult {
  const mappings: ColumnMapping[] = []
  const claimed = new Set<number>()
  const ambiguous: string[] = []
  const missingRequired: string[] = []

  for (const column of source.columns) {
    const { indices, names } = matchColumn(column, headers)

    if (indices.length === 1) {
      claimed.add(indices[0]!)
      mappings.push({
        column_key: column.key,
        header_index: indices[0]!,
        header_name: names[0]!,
        required: column.required,
        origin: 'AUTO',
        ambiguous_candidates: [],
      })
      continue
    }

    if (indices.length > 1) {
      // Two headers both claim this column. Picking one would be a guess.
      ambiguous.push(column.key)
      mappings.push({
        column_key: column.key,
        header_index: null,
        header_name: null,
        required: column.required,
        origin: 'UNMAPPED',
        ambiguous_candidates: names,
      })
      if (column.required) missingRequired.push(column.key)
      continue
    }

    mappings.push({
      column_key: column.key,
      header_index: null,
      header_name: null,
      required: column.required,
      origin: 'UNMAPPED',
      ambiguous_candidates: [],
    })
    if (column.required) missingRequired.push(column.key)
  }

  const unrecognised = headers.filter((_, index) => !claimed.has(index))

  const requiresConfirmation = missingRequired.length > 0 || ambiguous.length > 0

  return {
    state: 'AUTO_MAPPED',
    source_id: source.source_id,
    source_schema_version: source.schema_version,
    mappings,
    unrecognised_headers: unrecognised,
    missing_required: missingRequired,
    ambiguous,
    requires_confirmation: requiresConfirmation,
  }
}

/**
 * Applies user-supplied overrides. Each override is audited by the caller
 * (09_COMPLIANCE/AUDIT_LOGGING.md) before it reaches here.
 */
export function applyOverrides(
  result: MappingResult,
  source: SourceDefinition,
  headers: string[],
  overrides: Array<{ column_key: string; header_index: number | null }>,
): MappingResult {
  const byKey = new Map(result.mappings.map((m) => [m.column_key, { ...m }]))

  for (const override of overrides) {
    const mapping = byKey.get(override.column_key)
    if (!mapping) {
      throw new Error(
        `Column "${override.column_key}" is not part of source ${source.source_id}.`,
      )
    }
    if (override.header_index !== null && !headers[override.header_index]) {
      throw new Error(`Header index ${override.header_index} does not exist in this file.`)
    }
    mapping.header_index = override.header_index
    mapping.header_name = override.header_index === null ? null : headers[override.header_index]!
    mapping.origin = override.header_index === null ? 'UNMAPPED' : 'MANUAL'
    mapping.ambiguous_candidates = []
  }

  const mappings = [...byKey.values()]
  const missingRequired = mappings
    .filter((m) => m.required && m.header_index === null)
    .map((m) => m.column_key)
  const stillAmbiguous = mappings
    .filter((m) => m.ambiguous_candidates.length > 0)
    .map((m) => m.column_key)

  const claimed = new Set(
    mappings.map((m) => m.header_index).filter((i): i is number => i !== null),
  )

  return {
    ...result,
    state: 'USER_CONFIRMED',
    mappings,
    unrecognised_headers: headers.filter((_, index) => !claimed.has(index)),
    missing_required: missingRequired,
    ambiguous: stillAmbiguous,
    requires_confirmation: missingRequired.length > 0 || stillAmbiguous.length > 0,
  }
}

/** Serialisable form persisted on `mapping_templates.mapping_json`. */
export function toTemplateJson(result: MappingResult): Record<string, unknown> {
  return {
    source_id: result.source_id,
    source_schema_version: result.source_schema_version,
    mappings: result.mappings.map((m) => ({
      column_key: m.column_key,
      header_name: m.header_name,
      origin: m.origin,
    })),
  }
}
