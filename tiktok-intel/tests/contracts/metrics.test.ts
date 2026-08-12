/**
 * Metric contract tests.
 *
 * These assert the guarantees the metric contracts make about aggregation,
 * null handling and attribution — the rules that keep a number meaning what
 * the contract says it means.
 */

import { describe, expect, it } from 'vitest'
import {
  aggregatePeriod,
  computeChange,
  deriveRatio,
  MixedCurrencyError,
  zScoreOfLatest,
  type DailyMetricRow,
} from '../../lib/metrics/period'
import {
  assertComparable,
  METRIC_REGISTRY,
  ADDITIVE_METRICS,
  DERIVED_METRICS,
} from '../../lib/metrics/registry'

function row(overrides: Partial<DailyMetricRow>): DailyMetricRow {
  return {
    business_date: '2025-03-15',
    currency: 'MYR',
    traffic: null,
    product_views: null,
    add_to_cart: null,
    checkout: null,
    orders: null,
    gmv: null,
    spend: null,
    gross_revenue: null,
    paid_gmv: null,
    organic_gmv: null,
    live_gmv: null,
    affiliate_gmv: null,
    gmvmax_cost: null,
    gmvmax_orders: null,
    ...overrides,
  }
}

describe('denominator-weighted aggregation', () => {
  it('recomputes rates from summed components rather than averaging daily rates', () => {
    // Day 1: 1 order / 100 views = 1%. Day 2: 99 orders / 900 views = 11%.
    // The naive mean of the daily rates is 6%; the correct period rate is 10%.
    const rows = [
      row({ business_date: '2025-03-15', product_views: 100, orders: 1 }),
      row({ business_date: '2025-03-16', product_views: 900, orders: 99 }),
    ]
    const period = aggregatePeriod(rows, '2025-03-15', '2025-03-16', 'MYR')

    expect(period.derived.cvr).toBeCloseTo(0.1, 10)
    expect(period.derived.cvr).not.toBeCloseTo(0.06, 3)
  })

  it('returns null rather than zero when a denominator is zero', () => {
    expect(deriveRatio({ ...emptyTotals(), orders: 5, product_views: 0 }, 'cvr')).toBeNull()
  })

  it('returns null when either component is absent', () => {
    expect(deriveRatio({ ...emptyTotals(), orders: 5, product_views: null }, 'cvr')).toBeNull()
  })
})

describe('absent versus zero', () => {
  it('keeps an absent metric absent instead of summing it to zero', () => {
    const rows = [row({ product_views: 100, orders: 10, gmv: 500 })]
    const period = aggregatePeriod(rows, '2025-03-15', '2025-03-15', 'MYR')

    expect(period.totals.orders).toBe(10)
    expect(period.totals.spend).toBeNull()
  })

  it('treats a present zero as a real value', () => {
    const rows = [row({ product_views: 100, orders: 0, gmv: 0 })]
    const period = aggregatePeriod(rows, '2025-03-15', '2025-03-15', 'MYR')

    expect(period.totals.orders).toBe(0)
    expect(period.derived.cvr).toBe(0)
  })
})

describe('change computation', () => {
  const base = (orders: number) =>
    aggregatePeriod([row({ product_views: 1000, orders, gmv: orders * 50 })], '2025-03-15', '2025-03-15', 'MYR')

  it('marks a change against a zero baseline as not comparable', () => {
    const change = computeChange(base(10), base(0), 'orders')
    expect(change.change_pct).toBeNull()
    expect(change.comparable).toBe(false)
  })

  it('marks a change against an absent baseline as not comparable', () => {
    const current = base(10)
    const missing = aggregatePeriod([row({ product_views: 1000, gmv: 500 })], '2025-03-15', '2025-03-15', 'MYR')
    const change = computeChange(current, missing, 'orders')
    expect(change.comparable).toBe(false)
  })

  it('expresses decline as a negative proportion', () => {
    const change = computeChange(base(80), base(100), 'orders')
    expect(change.change_pct).toBeCloseTo(-0.2, 10)
  })
})

describe('attribution guardrails', () => {
  it('refuses to compare GMV Max ROI with paid ROAS', () => {
    expect(() => assertComparable('gmvmax_roi', 'ad_roi')).toThrow(/Attribution violation/)
    expect(() => assertComparable('ad_roi', 'gmvmax_roi')).toThrow(/Attribution violation/)
  })

  it('refuses to combine GMV Max gross revenue with shop GMV', () => {
    expect(() => assertComparable('gross_revenue', 'gmv')).toThrow(/Attribution violation/)
  })

  it('never labels GMV Max ROI as ROAS', () => {
    expect(METRIC_REGISTRY.gmvmax_roi.attribution).toBe('GMV_MAX')
    expect(METRIC_REGISTRY.gmvmax_roi.definition).toMatch(/NOT ordinary paid ROAS/)
  })

  it('computes GMV Max ROI from GMV Max cost, never from generic ad spend', () => {
    expect(METRIC_REGISTRY.gmvmax_roi.denominator).toBe('gmvmax_cost')
    expect(METRIC_REGISTRY.gmvmax_roi.numerator).toBe('gross_revenue')
  })
})

describe('registry completeness', () => {
  it('defines every declared metric', () => {
    for (const metric of [...ADDITIVE_METRICS, ...DERIVED_METRICS]) {
      const definition = METRIC_REGISTRY[metric]
      expect(definition, `${metric} has no registry entry`).toBeDefined()
      expect(definition.definition.length).toBeGreaterThan(0)
      expect(definition.contract_ref.length).toBeGreaterThan(0)
    }
  })

  it('gives every derived metric a numerator and denominator', () => {
    for (const metric of DERIVED_METRICS) {
      expect(METRIC_REGISTRY[metric].numerator, `${metric} numerator`).toBeDefined()
      expect(METRIC_REGISTRY[metric].denominator, `${metric} denominator`).toBeDefined()
    }
  })
})

describe('currency safety', () => {
  it('refuses to aggregate a period spanning two currencies', () => {
    const rows = [
      row({ business_date: '2025-03-15', currency: 'MYR', product_views: 10, orders: 1, gmv: 50 }),
      row({ business_date: '2025-03-16', currency: 'SGD', product_views: 10, orders: 1, gmv: 50 }),
    ]
    expect(() => aggregatePeriod(rows, '2025-03-15', '2025-03-16', 'MYR')).toThrow(MixedCurrencyError)
  })
})

describe('z-score', () => {
  it('declines to score a flat history', () => {
    expect(zScoreOfLatest([100, 100, 100, 100, 120]).z).toBeNull()
  })

  it('scores the latest observation against prior history only', () => {
    // Prior history [90,110,90,110]: mean 100, population stdev 10.
    const { z, mean, stdev, observations } = zScoreOfLatest([90, 110, 90, 110, 130])
    expect(observations).toBe(4)
    expect(mean).toBe(100)
    expect(stdev).toBe(10)
    expect(z).toBeCloseTo(3, 10)
  })
})

function emptyTotals() {
  const totals = {} as Record<(typeof ADDITIVE_METRICS)[number], number | null>
  for (const metric of ADDITIVE_METRICS) totals[metric] = null
  return totals
}
