/**
 * Supported source allowlist.
 *
 * 02_DATA/SUPPORTED_SOURCE_MANIFEST.md makes this an allowlist, not a
 * heuristic: "An importer must reject unsupported source formats instead of
 * guessing." Every entry must carry a source id, schema version, required
 * columns, a mapping to canonical metrics and a fixture.
 *
 * LAUNCH BLOCKER — recorded, not worked around:
 * No real TikTok export variant is registered here, because the pack ships no
 * verified column inventory for one and CLAUDE.md forbids inventing source
 * columns. The two entries below are SYNTHETIC sources: one derived from the
 * pack's own `fixtures/synthetic/gmv_max/manifest.json`, one covering shop
 * daily metrics for end-to-end development. Registering a real TikTok export
 * is a release prerequisite. See CONTRACT_LOCK_REPORT.md (GAP-001).
 */

import type { AttributionContext } from '../contracts/types'
import type { AdditiveMetric } from '../metrics/registry'

export type SourceGrain = 'SHOP_DAILY' | 'PRODUCT_DAILY'

export interface ColumnSpec {
  /** Canonical column key inside this source definition. */
  key: string
  /** Header spellings accepted for this column, compared case-insensitively. */
  aliases: string[]
  required: boolean
  type: 'DATE' | 'NUMBER' | 'TEXT'
  /** Canonical metric this column normalizes into. Null for keys/dimensions. */
  maps_to: AdditiveMetric | null
  attribution: AttributionContext
  /**
   * Ratio columns present in the export are read for reconciliation only and
   * never persisted — the engine recomputes every rate from its components.
   */
  derived_in_source?: boolean
}

export interface SourceDefinition {
  source_id: string
  name: string
  schema_version: string
  grain: SourceGrain
  /** SYNTHETIC sources must never be presented as real TikTok exports. */
  provenance: 'SYNTHETIC' | 'TIKTOK_VERIFIED'
  date_column: string
  /** Additional columns forming the natural key alongside the date. */
  key_columns: string[]
  columns: ColumnSpec[]
  currency: string
  fixture_id: string
  caveats: string[]
}

const DATE_COLUMN: ColumnSpec = {
  key: 'date',
  aliases: ['date', 'business_date', 'day', 'report_date'],
  required: true,
  type: 'DATE',
  maps_to: null,
  attribution: 'SHOP_TOTAL',
}

/**
 * Shop daily metrics. Synthetic — column names are this project's own, chosen
 * to be unambiguous rather than to imitate any TikTok export header.
 */
const SYN_SHOP_DAILY: SourceDefinition = {
  source_id: 'SYN-SHOP-DAILY',
  name: 'Synthetic shop daily metrics',
  schema_version: '1.0.0',
  grain: 'SHOP_DAILY',
  provenance: 'SYNTHETIC',
  date_column: 'date',
  key_columns: [],
  currency: 'MYR',
  fixture_id: 'SHOP-SYN-001',
  caveats: [
    'Synthetic development source. Not a TikTok export and must never be labelled as one.',
  ],
  columns: [
    DATE_COLUMN,
    { key: 'traffic', aliases: ['traffic', 'visitors', 'shop_visitors'], required: true, type: 'NUMBER', maps_to: 'traffic', attribution: 'SHOP_TOTAL' },
    { key: 'product_views', aliases: ['product_views', 'pdp_views'], required: true, type: 'NUMBER', maps_to: 'product_views', attribution: 'SHOP_TOTAL' },
    { key: 'add_to_cart', aliases: ['add_to_cart', 'atc'], required: false, type: 'NUMBER', maps_to: 'add_to_cart', attribution: 'SHOP_TOTAL' },
    { key: 'checkout', aliases: ['checkout', 'checkouts'], required: false, type: 'NUMBER', maps_to: 'checkout', attribution: 'SHOP_TOTAL' },
    { key: 'orders', aliases: ['orders', 'order_count'], required: true, type: 'NUMBER', maps_to: 'orders', attribution: 'SHOP_TOTAL' },
    { key: 'gmv', aliases: ['gmv', 'gross_merchandise_value'], required: true, type: 'NUMBER', maps_to: 'gmv', attribution: 'SHOP_TOTAL' },
    { key: 'spend', aliases: ['spend', 'ad_spend', 'ad_cost'], required: false, type: 'NUMBER', maps_to: 'spend', attribution: 'PAID' },
    { key: 'paid_gmv', aliases: ['paid_gmv'], required: false, type: 'NUMBER', maps_to: 'paid_gmv', attribution: 'PAID' },
    { key: 'organic_gmv', aliases: ['organic_gmv'], required: false, type: 'NUMBER', maps_to: 'organic_gmv', attribution: 'ORGANIC' },
    { key: 'live_gmv', aliases: ['live_gmv'], required: false, type: 'NUMBER', maps_to: 'live_gmv', attribution: 'LIVE' },
    { key: 'affiliate_gmv', aliases: ['affiliate_gmv'], required: false, type: 'NUMBER', maps_to: 'affiliate_gmv', attribution: 'AFFILIATE' },
  ],
}

/**
 * Product GMV Max daily metrics.
 *
 * Columns are exactly the `required_fields` declared in the pack's own
 * `fixtures/synthetic/gmv_max/manifest.json` (fixture GMVMAX-SYN-001). The
 * `roi` and `cost_per_order` columns are read for reconciliation only; the
 * engine recomputes both from gross revenue, cost and orders.
 */
const SYN_GMV_MAX: SourceDefinition = {
  source_id: 'SYN-GMVMAX',
  name: 'Synthetic Product GMV Max daily metrics',
  schema_version: '1.0.0',
  grain: 'SHOP_DAILY',
  provenance: 'SYNTHETIC',
  date_column: 'date',
  key_columns: [],
  currency: 'MYR',
  fixture_id: 'GMVMAX-SYN-001',
  caveats: [
    'Synthetic development source (fixtures/synthetic/gmv_max/manifest.json). Not a TikTok export.',
    'GMV Max ROI here is TikTok-defined Gross Revenue over GMV Max cost. It is not paid ROAS and must never be compared with one.',
  ],
  columns: [
    DATE_COLUMN,
    { key: 'orders_sku', aliases: ['orders_sku', 'sku_orders'], required: true, type: 'NUMBER', maps_to: 'gmvmax_orders', attribution: 'GMV_MAX' },
    { key: 'gross_revenue', aliases: ['gross_revenue'], required: true, type: 'NUMBER', maps_to: 'gross_revenue', attribution: 'GMV_MAX' },
    { key: 'cost', aliases: ['cost', 'gmv_max_cost'], required: true, type: 'NUMBER', maps_to: 'gmvmax_cost', attribution: 'GMV_MAX' },
    { key: 'roi', aliases: ['roi'], required: true, type: 'NUMBER', maps_to: null, attribution: 'GMV_MAX', derived_in_source: true },
    { key: 'cost_per_order', aliases: ['cost_per_order'], required: true, type: 'NUMBER', maps_to: null, attribution: 'GMV_MAX', derived_in_source: true },
  ],
}

/** Product-grain daily metrics. Synthetic. */
const SYN_PRODUCT_DAILY: SourceDefinition = {
  source_id: 'SYN-PRODUCT-DAILY',
  name: 'Synthetic product daily metrics',
  schema_version: '1.0.0',
  grain: 'PRODUCT_DAILY',
  provenance: 'SYNTHETIC',
  date_column: 'date',
  key_columns: ['product_key'],
  currency: 'MYR',
  fixture_id: 'PRODUCT-SYN-001',
  caveats: ['Synthetic development source. Not a TikTok export.'],
  columns: [
    DATE_COLUMN,
    { key: 'product_key', aliases: ['product_key', 'product_id', 'sku'], required: true, type: 'TEXT', maps_to: null, attribution: 'SHOP_TOTAL' },
    { key: 'product_views', aliases: ['product_views', 'pdp_views'], required: true, type: 'NUMBER', maps_to: 'product_views', attribution: 'SHOP_TOTAL' },
    { key: 'add_to_cart', aliases: ['add_to_cart', 'atc'], required: false, type: 'NUMBER', maps_to: 'add_to_cart', attribution: 'SHOP_TOTAL' },
    { key: 'orders', aliases: ['orders'], required: true, type: 'NUMBER', maps_to: 'orders', attribution: 'SHOP_TOTAL' },
    { key: 'gmv', aliases: ['gmv'], required: true, type: 'NUMBER', maps_to: 'gmv', attribution: 'SHOP_TOTAL' },
    { key: 'spend', aliases: ['spend', 'ad_spend'], required: false, type: 'NUMBER', maps_to: 'spend', attribution: 'PAID' },
  ],
}

export const SOURCE_REGISTRY: readonly SourceDefinition[] = [
  SYN_SHOP_DAILY,
  SYN_GMV_MAX,
  SYN_PRODUCT_DAILY,
]

export class UnsupportedSourceError extends Error {
  readonly source_id: string
  readonly schema_version: string
  constructor(sourceId: string, schemaVersion: string) {
    super(
      `Unsupported source "${sourceId}" (schema ${schemaVersion}). This importer rejects unregistered formats rather than guessing their column semantics. Register the source with a verified column inventory, mapping template and golden import test first.`,
    )
    this.name = 'UnsupportedSourceError'
    this.source_id = sourceId
    this.schema_version = schemaVersion
  }
}

export function resolveSource(sourceId: string, schemaVersion: string): SourceDefinition {
  const source = SOURCE_REGISTRY.find(
    (s) => s.source_id === sourceId && s.schema_version === schemaVersion,
  )
  if (!source) throw new UnsupportedSourceError(sourceId, schemaVersion)
  return source
}

export function findSource(sourceId: string, schemaVersion: string): SourceDefinition | undefined {
  return SOURCE_REGISTRY.find(
    (s) => s.source_id === sourceId && s.schema_version === schemaVersion,
  )
}

/** True when any registered source claims to be a verified TikTok export. */
export function hasVerifiedTikTokSource(): boolean {
  return SOURCE_REGISTRY.some((s) => s.provenance === 'TIKTOK_VERIFIED')
}
