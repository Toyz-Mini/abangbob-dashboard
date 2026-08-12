/**
 * Canonical metric registry.
 *
 * Implements the field contract required by `02_DATA/DATA_DICTIONARY.md` and
 * `contracts/README.md`. No metric may enter the diagnostic engine without an
 * entry here.
 *
 * Two hard rules from the contracts are enforced structurally rather than by
 * convention:
 *
 *  1. Rates are never summed or averaged across rows. Every ratio metric
 *     declares a numerator and denominator and is recomputed from summed
 *     components (`contracts/*.contract.md` — "Never sum rates or average
 *     ratios without denominator weighting").
 *
 *  2. Metrics carrying different attribution contexts are never added
 *     together, and GMV Max ROI is never relabelled as ROAS
 *     (`02_DATA/ATTRIBUTION_SPEC.md`, `02_DATA/METRIC_SEMANTIC_GUARDRAILS.md`).
 */

import type { AttributionContext } from '../contracts/types'
import { METRIC_VERSION } from '../contracts/versions'

/** Metrics stored additively at daily grain. */
export const ADDITIVE_METRICS = [
  'traffic',
  'product_views',
  'add_to_cart',
  'checkout',
  'orders',
  'gmv',
  'spend',
  'gross_revenue',
  'paid_gmv',
  'organic_gmv',
  'live_gmv',
  'affiliate_gmv',
  'gmvmax_cost',
  'gmvmax_orders',
] as const

/** Metrics derived from additive components. Never persisted as totals. */
export const DERIVED_METRICS = [
  'atc_rate',
  'checkout_rate',
  'cvr',
  'aov',
  'ad_roi',
  'gmvmax_roi',
  'gmvmax_cost_per_order',
] as const

export type AdditiveMetric = (typeof ADDITIVE_METRICS)[number]
export type DerivedMetric = (typeof DERIVED_METRICS)[number]
export type CanonicalMetric = AdditiveMetric | DerivedMetric

export type MetricUnit = 'COUNT' | 'CURRENCY' | 'RATIO'

export interface MetricDefinition {
  name: CanonicalMetric
  kind: 'ADDITIVE' | 'DERIVED'
  unit: MetricUnit
  attribution: AttributionContext
  /** Human definition, traceable to a contract file. */
  definition: string
  /** Contract file this definition is bound to. */
  contract_ref: string
  /** For derived metrics: the components it is recomputed from. */
  numerator?: AdditiveMetric
  denominator?: AdditiveMetric
  /** Aggregations that would corrupt the metric's meaning. */
  prohibited_aggregation: string[]
  /**
   * Metrics this one must never be compared against or summed with, because
   * the attribution contexts are incompatible.
   */
  incompatible_with: CanonicalMetric[]
  version: string
}

const def = (d: Omit<MetricDefinition, 'version'>): MetricDefinition => ({
  ...d,
  version: METRIC_VERSION,
})

export const METRIC_REGISTRY: Record<CanonicalMetric, MetricDefinition> = {
  traffic: def({
    name: 'traffic',
    kind: 'ADDITIVE',
    unit: 'COUNT',
    attribution: 'SHOP_TOTAL',
    definition: 'Source-defined shop visitor/session count at daily grain.',
    contract_ref: '02_DATA/DATA_DICTIONARY.md',
    prohibited_aggregation: ['average across shops', 'sum across currencies'],
    incompatible_with: [],
  }),
  product_views: def({
    name: 'product_views',
    kind: 'ADDITIVE',
    unit: 'COUNT',
    attribution: 'SHOP_TOTAL',
    definition: 'Source-defined product detail page views at daily grain.',
    contract_ref: '02_DATA/DATA_DICTIONARY.md',
    prohibited_aggregation: ['average across shops'],
    incompatible_with: [],
  }),
  add_to_cart: def({
    name: 'add_to_cart',
    kind: 'ADDITIVE',
    unit: 'COUNT',
    attribution: 'SHOP_TOTAL',
    definition: 'Source-defined add-to-cart events at daily grain.',
    contract_ref: '02_DATA/DATA_DICTIONARY.md',
    prohibited_aggregation: ['average across shops'],
    incompatible_with: [],
  }),
  checkout: def({
    name: 'checkout',
    kind: 'ADDITIVE',
    unit: 'COUNT',
    attribution: 'SHOP_TOTAL',
    definition: 'Source-defined checkout initiations at daily grain.',
    contract_ref: '02_DATA/DATA_DICTIONARY.md',
    prohibited_aggregation: ['average across shops'],
    incompatible_with: [],
  }),
  orders: def({
    name: 'orders',
    kind: 'ADDITIVE',
    unit: 'COUNT',
    attribution: 'SHOP_TOTAL',
    definition: 'Source-defined order count at the declared source grain.',
    contract_ref: 'contracts/orders.contract.md',
    prohibited_aggregation: ['average across shops'],
    incompatible_with: ['gmvmax_orders'],
  }),
  gmv: def({
    name: 'gmv',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'SHOP_TOTAL',
    definition:
      'Source-defined GMV at the declared source grain; no universal definition is inferred.',
    contract_ref: 'contracts/gmv.contract.md',
    prohibited_aggregation: ['sum across currencies without conversion'],
    incompatible_with: ['gross_revenue'],
  }),
  spend: def({
    name: 'spend',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'PAID',
    definition:
      'Paid advertising cost (VSA/PSA style campaigns). Distinct from Product GMV Max cost.',
    contract_ref: '02_DATA/ATTRIBUTION_SPEC.md',
    prohibited_aggregation: ['sum with gmvmax_cost'],
    incompatible_with: ['gmvmax_cost'],
  }),
  gross_revenue: def({
    name: 'gross_revenue',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'GMV_MAX',
    definition:
      'TikTok-defined Gross Revenue attributed to Product GMV Max; paid and organic outcomes may be included.',
    contract_ref: 'contracts/gmvmax_gross_revenue.contract.md',
    prohibited_aggregation: ['sum with gmv', 'sum with paid_gmv'],
    incompatible_with: ['gmv', 'paid_gmv'],
  }),
  paid_gmv: def({
    name: 'paid_gmv',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'PAID',
    definition: 'GMV attributed to paid advertising by the source report.',
    contract_ref: '02_DATA/ATTRIBUTION_SPEC.md',
    prohibited_aggregation: ['sum with gross_revenue'],
    incompatible_with: ['gross_revenue'],
  }),
  organic_gmv: def({
    name: 'organic_gmv',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'ORGANIC',
    definition: 'GMV attributed to organic traffic by the source report.',
    contract_ref: '02_DATA/ATTRIBUTION_SPEC.md',
    prohibited_aggregation: ['sum with gross_revenue'],
    incompatible_with: ['gross_revenue'],
  }),
  live_gmv: def({
    name: 'live_gmv',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'LIVE',
    definition: 'GMV attributed to LIVE sessions by the source report.',
    contract_ref: '02_DATA/ATTRIBUTION_SPEC.md',
    prohibited_aggregation: ['sum with gross_revenue'],
    incompatible_with: ['gross_revenue'],
  }),
  affiliate_gmv: def({
    name: 'affiliate_gmv',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'AFFILIATE',
    definition: 'GMV attributed to affiliate/creator activity by the source report.',
    contract_ref: '02_DATA/ATTRIBUTION_SPEC.md',
    prohibited_aggregation: ['sum with gross_revenue'],
    incompatible_with: ['gross_revenue'],
  }),
  gmvmax_cost: def({
    name: 'gmvmax_cost',
    kind: 'ADDITIVE',
    unit: 'CURRENCY',
    attribution: 'GMV_MAX',
    definition: 'Product GMV Max campaign cost as reported by TikTok.',
    contract_ref: 'contracts/gmvmax_roi.contract.md',
    prohibited_aggregation: ['sum with spend'],
    incompatible_with: ['spend'],
  }),
  gmvmax_orders: def({
    name: 'gmvmax_orders',
    kind: 'ADDITIVE',
    unit: 'COUNT',
    attribution: 'GMV_MAX',
    definition:
      'SKU orders attributed to Product GMV Max, including attributed paid and organic orders.',
    contract_ref: 'contracts/gmvmax_cost_per_order.contract.md',
    prohibited_aggregation: ['sum with orders'],
    incompatible_with: ['orders'],
  }),

  // ── Derived ─────────────────────────────────────────────────────────────
  atc_rate: def({
    name: 'atc_rate',
    kind: 'DERIVED',
    unit: 'RATIO',
    attribution: 'SHOP_TOTAL',
    definition: 'add_to_cart / product_views over the period.',
    contract_ref: '03_INTELLIGENCE/P0_RULE_CATALOG_V1.json (ATC-001)',
    numerator: 'add_to_cart',
    denominator: 'product_views',
    prohibited_aggregation: ['mean of daily rates', 'sum of rates'],
    incompatible_with: [],
  }),
  checkout_rate: def({
    name: 'checkout_rate',
    kind: 'DERIVED',
    unit: 'RATIO',
    attribution: 'SHOP_TOTAL',
    definition: 'checkout / add_to_cart over the period.',
    contract_ref: '11_DESIGN/SCREEN_SPEC.md (Screen 07 funnel)',
    numerator: 'checkout',
    denominator: 'add_to_cart',
    prohibited_aggregation: ['mean of daily rates', 'sum of rates'],
    incompatible_with: [],
  }),
  cvr: def({
    name: 'cvr',
    kind: 'DERIVED',
    unit: 'RATIO',
    attribution: 'SHOP_TOTAL',
    definition:
      'orders / product_views over the period. Denominator is product views, not sessions — see CONTRACT_LOCK_REPORT.md (DECISION-001).',
    contract_ref: '03_INTELLIGENCE/P0_RULE_CATALOG_V1.json (CONV-001, DATA-002)',
    numerator: 'orders',
    denominator: 'product_views',
    prohibited_aggregation: ['mean of daily rates', 'sum of rates'],
    incompatible_with: [],
  }),
  aov: def({
    name: 'aov',
    kind: 'DERIVED',
    unit: 'CURRENCY',
    attribution: 'SHOP_TOTAL',
    definition: 'gmv / orders over the period.',
    contract_ref: '03_INTELLIGENCE/P0_RULE_CATALOG_V1.json (AOV-001)',
    numerator: 'gmv',
    denominator: 'orders',
    prohibited_aggregation: ['mean of daily AOV'],
    incompatible_with: [],
  }),
  ad_roi: def({
    name: 'ad_roi',
    kind: 'DERIVED',
    unit: 'RATIO',
    attribution: 'PAID',
    definition:
      'paid_gmv / spend over the period. Paid-attribution ROAS. Must never be compared with gmvmax_roi.',
    contract_ref: '02_DATA/METRIC_SEMANTIC_GUARDRAILS.md',
    numerator: 'paid_gmv',
    denominator: 'spend',
    prohibited_aggregation: ['mean of daily ROI'],
    incompatible_with: ['gmvmax_roi'],
  }),
  gmvmax_roi: def({
    name: 'gmvmax_roi',
    kind: 'DERIVED',
    unit: 'RATIO',
    attribution: 'GMV_MAX',
    definition:
      'Product GMV Max Gross Revenue / Product GMV Max Cost. NOT ordinary paid ROAS — attribution includes organic and affiliate orders while the campaign is active.',
    contract_ref: 'contracts/gmvmax_roi.contract.md',
    numerator: 'gross_revenue',
    denominator: 'gmvmax_cost',
    prohibited_aggregation: ['mean of daily ROI', 'comparison with ad_roi'],
    incompatible_with: ['ad_roi'],
  }),
  gmvmax_cost_per_order: def({
    name: 'gmvmax_cost_per_order',
    kind: 'DERIVED',
    unit: 'CURRENCY',
    attribution: 'GMV_MAX',
    definition:
      'Product GMV Max Cost / attributed SKU Orders; includes attributed paid and organic orders.',
    contract_ref: 'contracts/gmvmax_cost_per_order.contract.md',
    numerator: 'gmvmax_cost',
    denominator: 'gmvmax_orders',
    prohibited_aggregation: ['mean of daily cost per order'],
    incompatible_with: [],
  }),
}

/**
 * Display label for a metric. GMV Max metrics always carry their attribution
 * context so the UI can never present them as plain paid performance
 * (11_DESIGN/SCREEN_SPEC.md — Screen 08).
 */
export const METRIC_LABELS: Record<CanonicalMetric, string> = {
  traffic: 'Traffic',
  product_views: 'Product views',
  add_to_cart: 'Add to cart',
  checkout: 'Checkout',
  orders: 'Orders',
  gmv: 'GMV',
  spend: 'Ad spend',
  gross_revenue: 'GMV Max gross revenue',
  paid_gmv: 'Paid GMV',
  organic_gmv: 'Organic GMV',
  live_gmv: 'LIVE GMV',
  affiliate_gmv: 'Affiliate GMV',
  gmvmax_cost: 'GMV Max cost',
  gmvmax_orders: 'GMV Max SKU orders',
  atc_rate: 'Add-to-cart rate',
  checkout_rate: 'Checkout rate',
  cvr: 'Conversion rate',
  aov: 'AOV',
  ad_roi: 'Paid ROAS',
  gmvmax_roi: 'GMV Max ROI',
  gmvmax_cost_per_order: 'GMV Max cost per order',
}

/**
 * Guard used by the engine and the UI. Throws rather than silently producing a
 * meaningless comparison.
 */
export function assertComparable(a: CanonicalMetric, b: CanonicalMetric): void {
  if (METRIC_REGISTRY[a].incompatible_with.includes(b)) {
    throw new Error(
      `Attribution violation: ${a} (${METRIC_REGISTRY[a].attribution}) must not be compared or combined with ${b} (${METRIC_REGISTRY[b].attribution}).`,
    )
  }
}

export function isAdditive(metric: CanonicalMetric): metric is AdditiveMetric {
  return METRIC_REGISTRY[metric].kind === 'ADDITIVE'
}
