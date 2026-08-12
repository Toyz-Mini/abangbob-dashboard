/**
 * Safe CSV/XLSX parsing.
 *
 * Implements 06_SECURITY/FILE_SECURITY.md. Uploaded spreadsheet content is
 * untrusted input from the moment it arrives:
 *
 *   - extension and content-type allowlist (CSV, XLSX only);
 *   - size and row ceilings enforced before and during parsing;
 *   - no macro execution — macro-enabled workbooks are rejected outright;
 *   - no formula evaluation — formula cells are detected and rejected, never
 *     computed, and their cached values are not trusted;
 *   - no external link fetching — SheetJS is configured not to resolve them,
 *     and workbooks declaring external references are rejected;
 *   - cell text is never interpreted as an instruction (CLAUDE.md).
 */

import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/** Locked by 01_PRODUCT/OPEN_DECISIONS.md. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const MAX_ROWS = 500_000

export type FileType = 'CSV' | 'XLSX'

const EXTENSIONS: Record<FileType, string[]> = {
  CSV: ['.csv'],
  XLSX: ['.xlsx'],
}

const CONTENT_TYPES: Record<FileType, string[]> = {
  CSV: ['text/csv', 'application/csv', 'text/plain'],
  XLSX: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
}

/** Macro-enabled and legacy formats are outside the launch allowlist. */
const REJECTED_EXTENSIONS = ['.xlsm', '.xlsb', '.xls', '.xltm', '.ods', '.csvz', '.zip']

export class FileRejectedError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'FileRejectedError'
    this.code = code
  }
}

export interface ParsedTable {
  /** Header names exactly as they appeared, trimmed of surrounding whitespace. */
  headers: string[]
  /** Data rows as raw strings. Interpretation happens during validation. */
  rows: string[][]
  row_count: number
}

export function assertAllowedFile(
  filename: string,
  sizeBytes: number,
  contentType?: string,
): FileType {
  const lower = filename.toLowerCase()

  for (const extension of REJECTED_EXTENSIONS) {
    if (lower.endsWith(extension)) {
      throw new FileRejectedError(
        'FILE_TYPE_NOT_ALLOWED',
        `Files of type ${extension} are not accepted. Only .csv and .xlsx are supported, and macro-enabled workbooks are never accepted.`,
      )
    }
  }

  const fileType = (Object.keys(EXTENSIONS) as FileType[]).find((type) =>
    EXTENSIONS[type].some((extension) => lower.endsWith(extension)),
  )
  if (!fileType) {
    throw new FileRejectedError(
      'FILE_TYPE_NOT_ALLOWED',
      'Only .csv and .xlsx files are accepted.',
    )
  }

  if (sizeBytes <= 0) {
    throw new FileRejectedError('FILE_EMPTY', 'The uploaded file is empty.')
  }
  if (sizeBytes > MAX_FILE_BYTES) {
    throw new FileRejectedError(
      'FILE_TOO_LARGE',
      `The file is ${(sizeBytes / 1_048_576).toFixed(1)} MB. The limit is 50 MB.`,
    )
  }

  // Content type is advisory — a mismatch is worth refusing, but its absence
  // is not, since some clients omit it.
  if (contentType && !CONTENT_TYPES[fileType].includes(contentType.split(';')[0]!.trim())) {
    throw new FileRejectedError(
      'CONTENT_TYPE_MISMATCH',
      `Declared content type "${contentType}" does not match a ${fileType} file.`,
    )
  }

  return fileType
}

/**
 * Leading =, +, -, @, tab and carriage return make a cell executable when the
 * file is reopened in a spreadsheet application. We never evaluate them, and we
 * never echo them back into an export.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/

export function looksLikeFormula(value: string): boolean {
  return FORMULA_PREFIX.test(value.trim()) && !isPlainNumber(value)
}

function isPlainNumber(value: string): boolean {
  return /^[+-]?(\d+(\.\d+)?|\.\d+)([eE][+-]?\d+)?$/.test(value.trim())
}

/**
 * Neutralises a value for display or re-export. A negative number stays a
 * number; anything else that starts with a formula trigger is prefixed so a
 * spreadsheet treats it as text.
 */
export function neutraliseCell(value: string): string {
  return looksLikeFormula(value) ? `'${value}` : value
}

export function parseCsv(content: string): ParsedTable {
  const result = Papa.parse<string[]>(content, {
    // Everything stays a string here. Type coercion belongs to validation,
    // where a failure can be reported against a specific row and column.
    header: false,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  })

  const fatal = result.errors.filter((e) => e.type === 'Delimiter' || e.type === 'Quotes')
  if (fatal.length > 0) {
    throw new FileRejectedError(
      'CSV_MALFORMED',
      `The CSV could not be parsed: ${fatal[0]!.message} (row ${fatal[0]!.row ?? 0}).`,
    )
  }

  const [headerRow, ...dataRows] = result.data
  if (!headerRow || headerRow.length === 0) {
    throw new FileRejectedError('NO_HEADER_ROW', 'The file has no header row.')
  }
  if (dataRows.length > MAX_ROWS) {
    throw new FileRejectedError(
      'TOO_MANY_ROWS',
      `The file has ${dataRows.length.toLocaleString()} rows. The limit is ${MAX_ROWS.toLocaleString()}.`,
    )
  }

  return {
    headers: headerRow.map((h) => String(h ?? '').trim()),
    rows: dataRows.map((row) => row.map((cell) => String(cell ?? '').trim())),
    row_count: dataRows.length,
  }
}

export function parseXlsx(buffer: ArrayBuffer): ParsedTable {
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      // Read formulas so they can be detected and refused. SheetJS does not
      // evaluate them; nothing here ever computes a formula result.
      cellFormula: true,
      cellHTML: false,
      cellDates: true,
      // Styles and VML carry no data we consume and widen the parse surface.
      cellStyles: false,
      bookVBA: false,
      bookDeps: false,
    })
  } catch (error) {
    throw new FileRejectedError(
      'XLSX_MALFORMED',
      `The workbook could not be read: ${error instanceof Error ? error.message : 'unknown error'}.`,
    )
  }

  if (workbook.vbaraw) {
    throw new FileRejectedError(
      'MACRO_WORKBOOK',
      'The workbook contains a macro project. Macro-enabled workbooks are never accepted.',
    )
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new FileRejectedError('NO_SHEET', 'The workbook contains no sheets.')
  }
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new FileRejectedError('NO_SHEET', 'The first sheet could not be read.')
  }

  const formulaCells: string[] = []
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith('!')) continue
    const typed = cell as XLSX.CellObject
    if (typed.f !== undefined) formulaCells.push(address)
    if (typed.l?.Target && /^(https?|ftp):/i.test(typed.l.Target)) {
      throw new FileRejectedError(
        'EXTERNAL_LINK',
        `Cell ${address} contains an external link. Workbooks with external references are not accepted.`,
      )
    }
  }

  if (formulaCells.length > 0) {
    throw new FileRejectedError(
      'FORMULA_CELLS',
      `The workbook contains formulas in ${formulaCells.length} cell(s), starting at ${formulaCells[0]}. Formulas are never evaluated and their cached values are not trusted. Export the sheet as values only, or upload a CSV.`,
    )
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  })

  const [headerRow, ...dataRows] = matrix
  if (!headerRow || headerRow.length === 0) {
    throw new FileRejectedError('NO_HEADER_ROW', 'The sheet has no header row.')
  }
  if (dataRows.length > MAX_ROWS) {
    throw new FileRejectedError(
      'TOO_MANY_ROWS',
      `The sheet has ${dataRows.length.toLocaleString()} rows. The limit is ${MAX_ROWS.toLocaleString()}.`,
    )
  }

  return {
    headers: headerRow.map((h) => String(h ?? '').trim()),
    rows: dataRows.map((row) => row.map((cell) => String(cell ?? '').trim())),
    row_count: dataRows.length,
  }
}

export function parseTable(fileType: FileType, content: string | ArrayBuffer): ParsedTable {
  if (fileType === 'CSV') {
    if (typeof content !== 'string') {
      throw new FileRejectedError('CSV_BINARY', 'CSV content must be decoded text.')
    }
    return parseCsv(content)
  }
  if (typeof content === 'string') {
    throw new FileRejectedError('XLSX_TEXT', 'XLSX content must be supplied as binary.')
  }
  return parseXlsx(content)
}

/** Server-generated storage key. Clients never choose a bucket or path. */
export function buildStorageKey(
  workspaceId: string,
  shopId: string,
  importFileId: string,
  fileType: FileType,
): string {
  const extension = fileType === 'CSV' ? 'csv' : 'xlsx'
  return `workspaces/${workspaceId}/shops/${shopId}/imports/${importFileId}.${extension}`
}
