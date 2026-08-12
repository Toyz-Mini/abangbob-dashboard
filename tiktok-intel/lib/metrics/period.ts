/**
 * Period aggregation and change computation.
 *
 * Every number the diagnostic engine sees comes from here. The module is pure
 * and deterministic: same normalized rows in, same metrics out. That is what
 * makes an analysis snapshot reproducible (01_PRODUCT/PRD.md).
 */

import {
  ADDITIVE_METRICS,
  DERIVED_METRICS,
  METRIC_REGISTRY,
  type AdditiveMetric,
  type CanonicalMetric,
  type DerivedMetric,
} from './registry'

/** One row of `normalized_daily_metrics`, shop grain. */
export interface DailyMetricRow {
  business_date: string
  currency: string
  traffic: number | null
  product_views: number | null
  add_to_cart: number | null
  checkout: number | null
  orders: number | null
  gmv: number | null
  spend: number | null
  gross_revenue: number | null
  paid_gmv: number | null
  organic_gmv: number | null
  live_gmv: number | null
  affiliate_gmv: number | null
  gmvmax_cost: number | null
  gmvmax_orders: number | null
}

/** One row of `normalized_product_metrics`. */
export interface DailyProductMetricRow {
  product_key: string
  business_date: string
  currency: string
  product_views: number | null
  add_to_cart: number | null
  orders: number | null
  gmv: number | null
  spend: number | null
}

export type PeriodTotals = Record<AdditiveMetric, number | null>
export type PeriodDerived = Record<DerivedMetric, number | null>

export interface PeriodCoverage {
  /** Calendar days in the requested period. */
  expected_days: number
  /** Days with at least one normalized row. */
  observed_days: number
  /** Per-metric share of expected days carrying a non-null value, 0..1. */
  metric_completeness: Record<AdditiveMetric, number>
}

export interface PeriodMetrics {
  start: string
  end: string
  currency: string
  totals: PeriodTotals
  derived: PeriodDerived
  coverage: PeriodCoverage
  /** Daily rows retained for anomaly detection and trend rendering. */
  daily: DailyMetricRow[]
}

export function daysBetweenInclusive(start: string, end: string): number {
  const s = Date.parse(`${start}T00:00:00Z`)
  const e = Date.parse(`${end}T00:00:00Z`)
  if (Number.isNaN(s) || Number.isNaN(e)) throw new Error('Invalid period bounds')
  return Math.floor((e - s) / 86_400_000) + 1
}

/**
 * Sums an additive metric across rows.
 *
 * Returns null when no row carries a value — an absent metric must stay absent
 * so that rules requiring it yield INSUFFICIENT_EVIDENCE rather than treating
 * missing data as zero (03_INTELLIGENCE/DECISION_CONTRACT.md).
 */
function sumAdditive(rows: DailyMetricRow[], metric: AdditiveMetric): number | null {
  let total = 0
  let seen = false
  for (const row of rows) {
    const value = row[metric]
    if (value === null || value === undefined) continue
    total += value
    seen = true
  }
  return seen ? total : null
}

/**
 * Recomputes a ratio from summed components.
 *
 * This is the denominator-weighted aggregation the metric contracts require;
 * averaging daily ratios is explicitly prohibited
 * (`contracts/*.contract.md` — Aggregation).
 */
export function deriveRatio(
  totals: Pick<PeriodTotals, AdditiveMetric>,
  metric: DerivedMetric,
): number | null {
  const definition = METRIC_REGISTRY[metric]
  const numeratorKey = definition.numerator
  const denominatorKey = definition.denominator
  if (!numeratorKey || !denominatorKey) return null

  const numerator = totals[numeratorKey]
  const denominator = totals[denominatorKey]
  if (numerator === null || denominator === null) return null
  if (denominator === 0) return null
  return numerator / denominator
}

export function aggregatePeriod(
  rows: DailyMetricRow[],
  start: string,
  end: string,
  fallbackCurrency: string,
): PeriodMetrics {
  const inPeriod = rows
    .filter((r) => r.business_date >= start && r.business_date <= end)
    .sort((a, b) => a.business_date.localeCompare(b.business_date))

  const currencies = new Set(inPeriod.map((r) => r.currency))
  if (currencies.size > 1) {
    // Mixed currencies in one analysis are prohibited without explicit
    // conversion (02_DATA/DATA_VALIDATION_SPEC.md).
    throw new MixedCurrencyError([...currencies])
  }
  const currency = inPeriod[0]?.currency ?? fallbackCurrency

  const totals = {} as PeriodTotals
  for (const metric of ADDITIVE_METRICS) {
    totals[metric] = sumAdditive(inPeriod, metric)
  }

  const derived = {} as PeriodDerived
  for (const metric of DERIVED_METRICS) {
    derived[metric] = deriveRatio(totals, metric)
  }

  const expectedDays = daysBetweenInclusive(start, end)
  const observedDays = new Set(inPeriod.map((r) => r.business_date)).size

  const metricCompleteness = {} as Record<AdditiveMetric, number>
  for (const metric of ADDITIVE_METRICS) {
    const withValue = inPeriod.filter((r) => r[metric] !== null && r[metric] !== undefined).length
    metricCompleteness[metric] = expectedDays === 0 ? 0 : withValue / expectedDays
  }

  return {
    start,
    end,
    currency,
    totals,
    derived,
    coverage: {
      expected_days: expectedDays,
      observed_days: observedDays,
      metric_completeness: metricCompleteness,
    },
    daily: inPeriod,
  }
}

export class MixedCurrencyError extends Error {
  readonly currencies: string[]
  constructor(currencies: string[]) {
    super(
      `Mixed currencies in a single analysis period: ${currencies.join(', ')}. Explicit conversion is required.`,
    )
    this.name = 'MixedCurrencyError'
    this.currencies = currencies
  }
}

export function readMetric(
  period: PeriodMetrics,
  metric: CanonicalMetric,
): number | null {
  return METRIC_REGISTRY[metric].kind === 'ADDITIVE'
    ? period.totals[metric as AdditiveMetric]
    : period.derived[metric as DerivedMetric]
}

export interface MetricChange {
  metric: CanonicalMetric
  current: number | null
  baseline: number | null
  change_abs: number | null
  /** Proportional change; -0.15 means a 15% decline. */
  change_pct: number | null
  /**
   * False when a percentage change cannot be expressed — baseline missing or
   * zero. Rules must treat this as "not evaluable", never as "no change".
   */
  comparable: boolean
}

export function computeChange(
  current: PeriodMetrics,
  baseline: PeriodMetrics,
  metric: CanonicalMetric,
): MetricChange {
  const currentValue = readMetric(current, metric)
  const baselineValue = readMetric(baseline, metric)

  if (currentValue === null || baselineValue === null) {
    return {
      metric,
      current: currentValue,
      baseline: baselineValue,
      change_abs: null,
      change_pct: null,
      comparable: false,
    }
  }

  const changeAbs = currentValue - baselineValue
  if (baselineValue === 0) {
    return {
      metric,
      current: currentValue,
      baseline: baselineValue,
      change_abs: changeAbs,
      change_pct: null,
      comparable: false,
    }
  }

  return {
    metric,
    current: currentValue,
    baseline: baselineValue,
    change_abs: changeAbs,
    change_pct: changeAbs / Math.abs(baselineValue),
    comparable: true,
  }
}

export interface ChangeSet {
  get(metric: CanonicalMetric): MetricChange
  all(): MetricChange[]
}

export function buildChangeSet(
  current: PeriodMetrics,
  baseline: PeriodMetrics,
): ChangeSet {
  const cache = new Map<CanonicalMetric, MetricChange>()
  const metrics: CanonicalMetric[] = [...ADDITIVE_METRICS, ...DERIVED_METRICS]
  for (const metric of metrics) {
    cache.set(metric, computeChange(current, baseline, metric))
  }
  return {
    get: (metric) => {
      const change = cache.get(metric)
      if (!change) throw new Error(`Unregistered metric: ${metric}`)
      return change
    },
    all: () => [...cache.values()],
  }
}

/**
 * Population z-score of the final observation against the preceding history.
 *
 * Used by ANOM-001, which additionally requires at least 14 historical
 * observations before an anomaly may be declared.
 */
export function zScoreOfLatest(
  history: number[],
): { z: number | null; mean: number; stdev: number; observations: number } {
  if (history.length < 2) {
    return { z: null, mean: 0, stdev: 0, observations: history.length }
  }
  const priorValues = history.slice(0, -1)
  const latest = history[history.length - 1]!
  const mean = priorValues.reduce((a, b) => a + b, 0) / priorValues.length
  const variance =
    priorValues.reduce((acc, v) => acc + (v - mean) ** 2, 0) / priorValues.length
  const stdev = Math.sqrt(variance)
  return {
    // A flat history has no dispersion; declaring an anomaly would be an
    // artefact of dividing by zero.
    z: stdev === 0 ? null : (latest - mean) / stdev,
    mean,
    stdev,
    observations: priorValues.length,
  }
}

/** Aggregates product rows to per-product period totals plus derived rates. */
export interface ProductPeriodMetrics {
  product_key: string
  product_views: number | null
  add_to_cart: number | null
  orders: number | null
  gmv: number | null
  spend: number | null
  cvr: number | null
  atc_rate: number | null
  aov: number | null
}

export function aggregateProducts(
  rows: DailyProductMetricRow[],
  start: string,
  end: string,
): ProductPeriodMetrics[] {
  const byProduct = new Map<string, DailyProductMetricRow[]>()
  for (const row of rows) {
    if (row.business_date < start || row.business_date > end) continue
    const bucket = byProduct.get(row.product_key)
    if (bucket) bucket.push(row)
    else byProduct.set(row.product_key, [row])
  }

  const sum = (
    productRows: DailyProductMetricRow[],
    key: 'product_views' | 'add_to_cart' | 'orders' | 'gmv' | 'spend',
  ): number | null => {
    let total = 0
    let seen = false
    for (const row of productRows) {
      const value = row[key]
      if (value === null || value === undefined) continue
      total += value
      seen = true
    }
    return seen ? total : null
  }

  const ratio = (numerator: number | null, denominator: number | null): number | null =>
    numerator === null || denominator === null || denominator === 0
      ? null
      : numerator / denominator

  return [...byProduct.entries()]
    .map(([productKey, productRows]) => {
      const productViews = sum(productRows, 'product_views')
      const addToCart = sum(productRows, 'add_to_cart')
      const orders = sum(productRows, 'orders')
      const gmv = sum(productRows, 'gmv')
      return {
        product_key: productKey,
        product_views: productViews,
        add_to_cart: addToCart,
        orders,
        gmv,
        spend: sum(productRows, 'spend'),
        cvr: ratio(orders, productViews),
        atc_rate: ratio(addToCart, productViews),
        aov: ratio(gmv, orders),
      }
    })
    .sort((a, b) => (b.gmv ?? 0) - (a.gmv ?? 0))
}
