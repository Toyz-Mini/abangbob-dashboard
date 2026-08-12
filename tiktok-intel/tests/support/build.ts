/**
 * Golden-vector fixture builder.
 *
 * Vectors are expressed as period totals, which is how the rule triggers are
 * written. The builder distributes a total evenly across the days of a period
 * so the engine sees realistic daily rows while the vector stays readable.
 *
 * All data produced here is SYNTHETIC and must never be presented as a real
 * TikTok export (fixtures/README.md).
 */

import type { DailyMetricRow, DailyProductMetricRow } from '../../lib/metrics/period'
import type { BusinessEvent } from '../../lib/intelligence/confounders'

export const PERIOD = { start: '2025-03-15', end: '2025-03-28' } // 14 days
export const BASELINE = { start: '2025-03-01', end: '2025-03-14' } // 14 days

/** Period totals. `null` means the metric is absent from the source data. */
export interface Totals {
  traffic?: number | null
  product_views?: number | null
  add_to_cart?: number | null
  checkout?: number | null
  orders?: number | null
  gmv?: number | null
  spend?: number | null
  gross_revenue?: number | null
  paid_gmv?: number | null
  organic_gmv?: number | null
  live_gmv?: number | null
  affiliate_gmv?: number | null
  gmvmax_cost?: number | null
  gmvmax_orders?: number | null
}

function datesIn(start: string, end: string): string[] {
  const out: string[] = []
  let cursor = Date.parse(`${start}T00:00:00Z`)
  const last = Date.parse(`${end}T00:00:00Z`)
  while (cursor <= last) {
    out.push(new Date(cursor).toISOString().slice(0, 10))
    cursor += 86_400_000
  }
  return out
}

const METRIC_KEYS = [
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

/**
 * Spreads each total evenly across the period's days.
 *
 * An explicit `null` total produces `null` on every day, which is how a metric
 * absent from the source export is represented — distinct from a metric that
 * is present and zero.
 */
/**
 * Splits an integer total into `days` integer parts that sum back to it
 * exactly.
 *
 * Even division would reintroduce the total as a sum of repeating binary
 * fractions — 10 orders over 14 days re-sums to 9.999999999999998, which sits
 * on the wrong side of a "orders < 10" gate. Integer parts remove the artefact
 * from the fixture rather than papering over it in the engine.
 */
function splitExact(total: number, days: number): number[] {
  if (!Number.isInteger(total)) {
    return Array.from({ length: days }, () => total / days)
  }
  const base = Math.floor(total / days)
  const remainder = total - base * days
  return Array.from({ length: days }, (_, i) => base + (i < remainder ? 1 : 0))
}

export function buildDays(
  start: string,
  end: string,
  totals: Totals,
  currency = 'MYR',
): DailyMetricRow[] {
  const dates = datesIn(start, end)

  const series: Partial<Record<(typeof METRIC_KEYS)[number], number[] | null>> = {}
  for (const key of METRIC_KEYS) {
    const total = totals[key]
    series[key] = total === null || total === undefined ? null : splitExact(total, dates.length)
  }

  return dates.map((business_date, index) => {
    const row = { business_date, currency } as DailyMetricRow
    for (const key of METRIC_KEYS) {
      const values = series[key]
      row[key] = values ? (values[index] ?? 0) : null
    }
    return row
  })
}

export interface ProductTotals {
  product_key: string
  product_views?: number | null
  add_to_cart?: number | null
  orders?: number | null
  gmv?: number | null
  spend?: number | null
}

export function buildProductDays(
  start: string,
  end: string,
  products: ProductTotals[],
  currency = 'MYR',
): DailyProductMetricRow[] {
  const dates = datesIn(start, end)
  const rows: DailyProductMetricRow[] = []
  for (const product of products) {
    const series = (value: number | null | undefined): number[] | null =>
      value === null || value === undefined ? null : splitExact(value, dates.length)
    const views = series(product.product_views)
    const atc = series(product.add_to_cart)
    const orders = series(product.orders)
    const gmv = series(product.gmv)
    const spend = series(product.spend)

    dates.forEach((business_date, index) => {
      rows.push({
        product_key: product.product_key,
        business_date,
        currency,
        product_views: views ? (views[index] ?? 0) : null,
        add_to_cart: atc ? (atc[index] ?? 0) : null,
        orders: orders ? (orders[index] ?? 0) : null,
        gmv: gmv ? (gmv[index] ?? 0) : null,
        spend: spend ? (spend[index] ?? 0) : null,
      })
    })
  }
  return rows
}

export function stockoutEvent(
  start = `${PERIOD.start}T00:00:00Z`,
  end = `${PERIOD.end}T00:00:00Z`,
): BusinessEvent {
  return {
    event_type: 'STOCKOUT',
    name: 'Best-seller variant out of stock',
    start_at: start,
    end_at: end,
    scope_json: {},
  }
}

/**
 * Daily rows with deliberate dispersion, used by anomaly vectors. Without
 * variance a z-score is undefined and ANOM-001 correctly declines to fire.
 */
export function buildVariedDays(
  start: string,
  end: string,
  values: { gmv: number[]; base: Totals },
  currency = 'MYR',
): DailyMetricRow[] {
  const dates = datesIn(start, end)
  const rows = buildDays(start, end, values.base, currency)
  return rows.map((row, index) => ({
    ...row,
    gmv: values.gmv[index % values.gmv.length] ?? row.gmv,
    business_date: dates[index]!,
  }))
}
