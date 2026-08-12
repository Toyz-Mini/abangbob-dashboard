/**
 * Ingestion tests.
 *
 * Covers the file-security controls of 06_SECURITY/FILE_SECURITY.md, the
 * mapping states of 02_DATA/DATA_MAPPING_SPEC.md and the validation layers of
 * 02_DATA/DATA_VALIDATION_SPEC.md.
 */

import { describe, expect, it } from 'vitest'
import {
  assertAllowedFile,
  FileRejectedError,
  looksLikeFormula,
  neutraliseCell,
  parseCsv,
  MAX_FILE_BYTES,
  buildStorageKey,
} from '../../lib/ingestion/parse'
import { applyOverrides, autoMap } from '../../lib/ingestion/mapping'
import {
  resolveSource,
  UnsupportedSourceError,
  hasVerifiedTikTokSource,
} from '../../lib/ingestion/source-registry'
import { validateAndNormalize } from '../../lib/ingestion/validate'

const SHOP_SOURCE = resolveSource('SYN-SHOP-DAILY', '1.0.0')
const GMVMAX_SOURCE = resolveSource('SYN-GMVMAX', '1.0.0')

function importCsv(csv: string, source = SHOP_SOURCE, currency = 'MYR') {
  const table = parseCsv(csv)
  const mapping = autoMap(source, table.headers)
  return { table, mapping, result: validateAndNormalize(table, source, mapping, currency) }
}

describe('file allowlist', () => {
  it('accepts csv and xlsx', () => {
    expect(assertAllowedFile('export.csv', 1024)).toBe('CSV')
    expect(assertAllowedFile('export.xlsx', 1024)).toBe('XLSX')
  })

  it('rejects macro-enabled workbooks', () => {
    expect(() => assertAllowedFile('export.xlsm', 1024)).toThrow(FileRejectedError)
    expect(() => assertAllowedFile('export.xlsb', 1024)).toThrow(/never accepted/)
  })

  it('rejects legacy and archive formats', () => {
    for (const name of ['export.xls', 'export.ods', 'export.zip']) {
      expect(() => assertAllowedFile(name, 1024), name).toThrow(FileRejectedError)
    }
  })

  it('rejects anything above the 50 MB ceiling', () => {
    expect(() => assertAllowedFile('export.csv', MAX_FILE_BYTES + 1)).toThrow(/50 MB/)
  })

  it('rejects an empty file', () => {
    expect(() => assertAllowedFile('export.csv', 0)).toThrow(/empty/)
  })

  it('rejects a content type that contradicts the extension', () => {
    expect(() => assertAllowedFile('export.csv', 1024, 'application/zip')).toThrow(
      /does not match/,
    )
  })
})

describe('formula safety', () => {
  it('identifies formula-triggering values', () => {
    for (const value of ['=SUM(A1:A2)', '+1+1', '@SUM(1)', '-cmd|calc', '\t=1']) {
      expect(looksLikeFormula(value), value).toBe(true)
    }
  })

  it('does not treat a plain negative number as a formula', () => {
    expect(looksLikeFormula('-42')).toBe(false)
    expect(looksLikeFormula('-3.5')).toBe(false)
  })

  it('neutralises a formula for re-export without evaluating it', () => {
    expect(neutraliseCell('=1+1')).toBe("'=1+1")
    expect(neutraliseCell('42')).toBe('42')
  })

  it('rejects a row whose numeric cell carries a formula', () => {
    const { result } = importCsv(
      [
        'date,traffic,product_views,orders,gmv',
        '2025-03-01,100,50,5,250',
        '2025-03-02,=SUM(B2:B2),50,5,250',
      ].join('\n'),
    )
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.layer === 'CONTENT_SAFETY')).toBe(true)
    expect(result.summary.rows_accepted).toBe(1)
  })
})

describe('source allowlist', () => {
  it('rejects an unregistered source rather than guessing its columns', () => {
    expect(() => resolveSource('tiktok_unknown_export', '1.0.0')).toThrow(UnsupportedSourceError)
    expect(() => resolveSource('SYN-SHOP-DAILY', '9.9.9')).toThrow(/rejects unregistered formats/)
  })

  it('registers no source as a verified TikTok export yet', () => {
    // Guards the launch blocker recorded in CONTRACT_LOCK_REPORT.md (GAP-001):
    // this must fail the day a real export is registered without a fixture.
    expect(hasVerifiedTikTokSource()).toBe(false)
  })
})

describe('column mapping', () => {
  it('auto-maps recognised headers and reports unknown ones', () => {
    const table = parseCsv('date,traffic,pdp_views,orders,gmv,mystery\n2025-03-01,1,1,1,1,x')
    const mapping = autoMap(SHOP_SOURCE, table.headers)

    expect(mapping.state).toBe('AUTO_MAPPED')
    expect(mapping.requires_confirmation).toBe(false)
    expect(mapping.unrecognised_headers).toEqual(['mystery'])
    expect(mapping.mappings.find((m) => m.column_key === 'product_views')?.header_name).toBe(
      'pdp_views',
    )
  })

  it('refuses to choose when two headers claim the same column', () => {
    const table = parseCsv('date,product_views,pdp_views,traffic,orders,gmv\n2025-03-01,1,1,1,1,1')
    const mapping = autoMap(SHOP_SOURCE, table.headers)

    expect(mapping.ambiguous).toContain('product_views')
    expect(mapping.requires_confirmation).toBe(true)
    expect(
      mapping.mappings.find((m) => m.column_key === 'product_views')?.ambiguous_candidates,
    ).toEqual(['product_views', 'pdp_views'])
  })

  it('resolves ambiguity through an explicit override', () => {
    const table = parseCsv('date,product_views,pdp_views,traffic,orders,gmv\n2025-03-01,1,1,1,1,1')
    const auto = autoMap(SHOP_SOURCE, table.headers)
    const confirmed = applyOverrides(auto, SHOP_SOURCE, table.headers, [
      { column_key: 'product_views', header_index: 1 },
    ])

    expect(confirmed.state).toBe('USER_CONFIRMED')
    expect(confirmed.requires_confirmation).toBe(false)
    expect(confirmed.mappings.find((m) => m.column_key === 'product_views')?.origin).toBe('MANUAL')
  })

  it('blocks confirmation while a required column is unmapped', () => {
    const table = parseCsv('date,traffic\n2025-03-01,1')
    const mapping = autoMap(SHOP_SOURCE, table.headers)
    expect(mapping.missing_required).toEqual(
      expect.arrayContaining(['product_views', 'orders', 'gmv']),
    )
    expect(mapping.requires_confirmation).toBe(true)
  })
})

describe('validation layers', () => {
  const header = 'date,traffic,product_views,add_to_cart,checkout,orders,gmv'

  it('accepts a clean file and records provenance', () => {
    const { result } = importCsv(
      [header, '2025-03-01,1000,500,60,50,40,2000', '2025-03-02,1100,550,66,55,44,2200'].join('\n'),
    )

    expect(result.ok).toBe(true)
    expect(result.shopRows).toHaveLength(2)
    expect(result.summary.date_min).toBe('2025-03-01')
    expect(result.summary.date_max).toBe('2025-03-02')
    expect(result.provenance.source_id).toBe('SYN-SHOP-DAILY')
    expect(result.provenance.provenance).toBe('SYNTHETIC')
    expect(result.provenance.metric_version).toBeTruthy()
  })

  it('refuses an ambiguous date rather than guessing day-first or month-first', () => {
    const { result } = importCsv([header, '03/04/2025,1000,500,60,50,40,2000'].join('\n'))
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.layer === 'DATE' && /unambiguous/.test(i.message))).toBe(true)
  })

  it('accepts an unambiguous year-first slash date', () => {
    const { result } = importCsv([header, '2025/03/04,1000,500,60,50,40,2000'].join('\n'))
    expect(result.ok).toBe(true)
    expect(result.shopRows[0]!.business_date).toBe('2025-03-04')
  })

  it('rejects a negative value', () => {
    const { result } = importCsv([header, '2025-03-01,1000,500,60,50,-40,2000'].join('\n'))
    expect(result.issues.some((i) => i.layer === 'RANGE')).toBe(true)
    expect(result.ok).toBe(false)
  })

  it('rejects a decorated number rather than stripping the symbol', () => {
    const { result } = importCsv([header, '2025-03-01,1000,500,60,50,40,RM2000'].join('\n'))
    expect(result.issues.some((i) => i.layer === 'TYPE')).toBe(true)
  })

  it('accepts thousands separators', () => {
    const { result } = importCsv([header, '2025-03-01,"1,000",500,60,50,40,"2,000"'].join('\n'))
    expect(result.ok).toBe(true)
    expect(result.shopRows[0]!.values.traffic).toBe(1000)
  })

  it('rejects a duplicate natural key', () => {
    const { result } = importCsv(
      [header, '2025-03-01,1000,500,60,50,40,2000', '2025-03-01,900,450,50,45,35,1800'].join('\n'),
    )
    expect(result.issues.some((i) => i.layer === 'GRAIN' && /Duplicate/.test(i.message))).toBe(true)
    expect(result.summary.rows_accepted).toBe(1)
  })

  it('warns when funnel stages contradict each other', () => {
    const { result } = importCsv([header, '2025-03-01,1000,500,600,50,40,2000'].join('\n'))
    const crossField = result.issues.filter((i) => i.layer === 'CROSS_FIELD')
    expect(crossField).toHaveLength(1)
    expect(crossField[0]!.severity).toBe('WARNING')
    // A warning does not discard the row; the engine decides what to do with it.
    expect(result.ok).toBe(true)
  })

  it('keeps an omitted optional column absent rather than zero', () => {
    const { result } = importCsv(
      ['date,traffic,product_views,orders,gmv', '2025-03-01,1000,500,40,2000'].join('\n'),
    )
    expect(result.ok).toBe(true)
    expect(result.shopRows[0]!.values.add_to_cart).toBeUndefined()
    expect('add_to_cart' in result.shopRows[0]!.values).toBe(false)
  })

  it('fails an import in which no row survives', () => {
    const { result } = importCsv([header, 'not-a-date,1000,500,60,50,40,2000'].join('\n'))
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => /nothing to import/.test(i.message))).toBe(true)
  })
})

describe('reconciliation against source-provided ratios', () => {
  const header = 'date,orders_sku,gross_revenue,cost,roi,cost_per_order'

  it('accepts a ratio that matches its components', () => {
    const { result } = importCsv([header, '2025-03-01,20,4000,1000,4,50'].join('\n'), GMVMAX_SOURCE)
    expect(result.issues.filter((i) => i.layer === 'RECONCILIATION')).toHaveLength(0)
    expect(result.ok).toBe(true)
  })

  it('flags a reported ratio that disagrees with its components', () => {
    const { result } = importCsv(
      [header, '2025-03-01,20,4000,1000,6.5,50'].join('\n'),
      GMVMAX_SOURCE,
    )
    const reconciliation = result.issues.filter((i) => i.layer === 'RECONCILIATION')
    expect(reconciliation).toHaveLength(1)
    expect(reconciliation[0]!.message).toMatch(/differs from 4\.0000/)
    // The recomputed value wins; the row is still imported.
    expect(result.ok).toBe(true)
  })

  it('never persists a source-provided ratio as a metric', () => {
    const { result } = importCsv([header, '2025-03-01,20,4000,1000,4,50'].join('\n'), GMVMAX_SOURCE)
    const values = result.shopRows[0]!.values as Record<string, unknown>
    expect(values.gmvmax_cost).toBe(1000)
    expect(values.gross_revenue).toBe(4000)
    expect(values.roi).toBeUndefined()
    expect(values.cost_per_order).toBeUndefined()
  })

  it('carries the GMV Max attribution caveat into every import', () => {
    const { result } = importCsv([header, '2025-03-01,20,4000,1000,4,50'].join('\n'), GMVMAX_SOURCE)
    expect(
      result.issues.some((i) => i.layer === 'ATTRIBUTION' && /not paid ROAS/.test(i.message)),
    ).toBe(true)
  })
})

describe('storage keys', () => {
  it('are server-generated and tenant-scoped', () => {
    const key = buildStorageKey('ws-1', 'shop-2', 'file-3', 'CSV')
    expect(key).toBe('workspaces/ws-1/shops/shop-2/imports/file-3.csv')
  })
})
