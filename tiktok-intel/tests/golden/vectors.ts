/**
 * P0 golden vectors.
 *
 * 07_QA/P0_GOLDEN_VECTOR_REQUIREMENTS.md requires, for every P0 rule:
 *   1. positive trigger      2. negative/non-trigger
 *   3. insufficient sample   4. suppression/confounder
 *   5. boundary threshold    6. missing data
 * — each where applicable to the rule.
 *
 * All fixtures are SYNTHETIC. They are shaped to exercise thresholds, not to
 * represent any real shop (fixtures/README.md).
 */

import type { ConfidenceLabel, ConfounderId, DecisionStatus } from '../../lib/contracts/types'
import type { BusinessEvent } from '../../lib/intelligence/confounders'
import type { DailyMetricRow, DailyProductMetricRow } from '../../lib/metrics/period'
import {
  BASELINE,
  buildDays,
  buildProductDays,
  buildVariedDays,
  PERIOD,
  stockoutEvent,
  type ProductTotals,
  type Totals,
} from '../support/build'

export type VectorCategory =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'INSUFFICIENT_SAMPLE'
  | 'SUPPRESSION'
  | 'BOUNDARY'
  | 'MISSING_DATA'

export interface GoldenVector {
  id: string
  rule: string
  category: VectorCategory
  description: string
  current: Totals
  baseline: Totals
  productsCurrent?: ProductTotals[]
  productsBaseline?: ProductTotals[]
  events?: BusinessEvent[]
  /** Overrides the even-distribution builder when day-level shape matters. */
  dailyOverride?: () => DailyMetricRow[]
  expected: {
    outcome: 'TRIGGERED' | 'NOT_TRIGGERED' | 'SUPPRESSED' | 'NOT_EVALUABLE'
    suppression_reason?: ConfounderId
    confidence?: ConfidenceLabel
    /** Asserted analysis-level status, when the vector fixes it. */
    status?: DecisionStatus
  }
}

/** Healthy 14-day shop. Every other vector is a deviation from this. */
export const BASE: Totals = {
  traffic: 20_000,
  product_views: 10_000,
  add_to_cart: 1_200,
  checkout: 900,
  orders: 800,
  gmv: 40_000,
  spend: 2_000,
  paid_gmv: 8_000,
  gross_revenue: 12_000,
  gmvmax_cost: 3_000,
  gmvmax_orders: 200,
}

const with_ = (overrides: Totals): Totals => ({ ...BASE, ...overrides })

export const VECTORS: GoldenVector[] = [
  // ── DATA-001 · Insufficient Funnel Data ────────────────────────────────
  {
    id: 'DATA-001-missing-funnel-001',
    rule: 'DATA-001',
    category: 'MISSING_DATA',
    description: 'Product views absent from the export terminates the analysis.',
    current: with_({ product_views: null }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED', status: 'INSUFFICIENT_EVIDENCE' },
  },
  {
    id: 'DATA-001-negative-001',
    rule: 'DATA-001',
    category: 'NEGATIVE',
    description: 'All required funnel metrics present — analysis proceeds.',
    current: BASE,
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED', status: 'HEALTHY' },
  },

  // ── DATA-002 · Low Sample Warning ──────────────────────────────────────
  {
    id: 'DATA-002-positive-001',
    rule: 'DATA-002',
    category: 'POSITIVE',
    description: 'Eight orders is below the minimum sample for conversion findings.',
    current: { traffic: 300, product_views: 150, add_to_cart: 20, checkout: 12, orders: 8, gmv: 400 },
    baseline: { traffic: 300, product_views: 150, add_to_cart: 20, checkout: 12, orders: 8, gmv: 400 },
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'DATA-002-negative-001',
    rule: 'DATA-002',
    category: 'NEGATIVE',
    description: 'Sample comfortably exceeds both gates.',
    current: BASE,
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'DATA-002-boundary-001',
    rule: 'DATA-002',
    category: 'BOUNDARY',
    description: 'Exactly 10 orders and 100 product views sits on the pass side of both gates.',
    current: { traffic: 200, product_views: 100, add_to_cart: 30, checkout: 15, orders: 10, gmv: 500 },
    baseline: { traffic: 200, product_views: 100, add_to_cart: 30, checkout: 15, orders: 10, gmv: 500 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'DATA-002-missing-001',
    rule: 'DATA-002',
    category: 'MISSING_DATA',
    description: 'Orders absent — the rule cannot judge sample size.',
    current: with_({ orders: null }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED', status: 'INSUFFICIENT_EVIDENCE' },
  },

  // ── TRAFFIC-001 · Traffic Decline ──────────────────────────────────────
  {
    id: 'TRAFFIC-001-positive-001',
    rule: 'TRAFFIC-001',
    category: 'POSITIVE',
    description: 'Traffic down 20% with the funnel scaling down proportionally.',
    current: with_({
      traffic: 16_000,
      product_views: 8_000,
      add_to_cart: 960,
      checkout: 720,
      orders: 640,
      gmv: 32_000,
    }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED', confidence: 'HIGH' },
  },
  {
    id: 'TRAFFIC-001-negative-001',
    rule: 'TRAFFIC-001',
    category: 'NEGATIVE',
    description: 'Traffic down 5% — above the trigger threshold.',
    current: with_({ traffic: 19_000 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'TRAFFIC-001-boundary-001',
    rule: 'TRAFFIC-001',
    category: 'BOUNDARY',
    description: 'Traffic down exactly 15% triggers the rule.',
    current: with_({ traffic: 17_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'TRAFFIC-001-insufficient-sample-001',
    rule: 'TRAFFIC-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Traffic halved but current traffic of 80 is below the minimum of 100.',
    current: { traffic: 80, product_views: 60, add_to_cart: 12, checkout: 8, orders: 6, gmv: 300 },
    baseline: { traffic: 200, product_views: 150, add_to_cart: 30, checkout: 20, orders: 15, gmv: 750 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'TRAFFIC-001-missing-001',
    rule: 'TRAFFIC-001',
    category: 'MISSING_DATA',
    description: 'Traffic column absent from the export.',
    current: with_({ traffic: null }),
    baseline: with_({ traffic: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── TRAFFIC-002 · Traffic Growth Without GMV Response ──────────────────
  {
    id: 'TRAFFIC-002-positive-001',
    rule: 'TRAFFIC-002',
    category: 'POSITIVE',
    description: 'Traffic up 25% while GMV is flat.',
    current: with_({
      traffic: 25_000,
      product_views: 12_500,
      add_to_cart: 1_500,
      checkout: 1_125,
      orders: 800,
      gmv: 40_000,
    }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'TRAFFIC-002-negative-001',
    rule: 'TRAFFIC-002',
    category: 'NEGATIVE',
    description: 'Traffic up 25% and GMV up 25% — a healthy response.',
    current: with_({
      traffic: 25_000,
      product_views: 12_500,
      add_to_cart: 1_500,
      checkout: 1_125,
      orders: 1_000,
      gmv: 50_000,
    }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'TRAFFIC-002-boundary-001',
    rule: 'TRAFFIC-002',
    category: 'BOUNDARY',
    description: 'Traffic exactly +20% and GMV exactly +5%.',
    current: with_({ traffic: 24_000, gmv: 42_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'TRAFFIC-002-suppressed-data-invalid-001',
    rule: 'TRAFFIC-002',
    category: 'SUPPRESSION',
    description: 'Add-to-cart exceeding product views invalidates the funnel.',
    current: with_({
      traffic: 25_000,
      product_views: 1_000,
      add_to_cart: 1_500,
      checkout: 1_125,
      orders: 800,
      gmv: 40_000,
    }),
    baseline: BASE,
    expected: {
      outcome: 'SUPPRESSED',
      suppression_reason: 'DATA-INVALID',
      status: 'DATA_INVALID',
    },
  },
  {
    id: 'TRAFFIC-002-insufficient-sample-001',
    rule: 'TRAFFIC-002',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Traffic up 33% with flat GMV, but current traffic of 80 is below 100.',
    current: { traffic: 80, product_views: 50, add_to_cart: 10, checkout: 6, orders: 5, gmv: 250 },
    baseline: { traffic: 60, product_views: 50, add_to_cart: 10, checkout: 6, orders: 5, gmv: 250 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'TRAFFIC-002-missing-001',
    rule: 'TRAFFIC-002',
    category: 'MISSING_DATA',
    description: 'Traffic absent — growth cannot be measured.',
    current: with_({ traffic: null }),
    baseline: with_({ traffic: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── ATC-001 · ATC Rate Decline ─────────────────────────────────────────
  {
    id: 'ATC-001-positive-001',
    rule: 'ATC-001',
    category: 'POSITIVE',
    description: 'Add-to-cart rate falls from 12.0% to 10.0% on unchanged views.',
    current: with_({ add_to_cart: 1_000, checkout: 850, orders: 800 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ATC-001-negative-001',
    rule: 'ATC-001',
    category: 'NEGATIVE',
    description: 'Add-to-cart rate down 4% — inside the threshold.',
    current: with_({ add_to_cart: 1_150, checkout: 880, orders: 800 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ATC-001-boundary-001',
    rule: 'ATC-001',
    category: 'BOUNDARY',
    description: 'Add-to-cart rate down exactly 15%.',
    current: with_({ add_to_cart: 1_020, checkout: 860, orders: 800 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ATC-001-suppressed-stockout-001',
    rule: 'ATC-001',
    category: 'SUPPRESSION',
    description: 'A recorded stockout overlapping the period suppresses the rule.',
    current: with_({ add_to_cart: 1_000, checkout: 850, orders: 800 }),
    baseline: BASE,
    events: [stockoutEvent()],
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'STOCKOUT_CONFOUNDER' },
  },
  {
    id: 'ATC-001-insufficient-sample-001',
    rule: 'ATC-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Rate halved but only 90 product views.',
    current: { traffic: 200, product_views: 90, add_to_cart: 9, checkout: 6, orders: 5, gmv: 250 },
    baseline: { traffic: 200, product_views: 90, add_to_cart: 18, checkout: 12, orders: 10, gmv: 500 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ATC-001-missing-001',
    rule: 'ATC-001',
    category: 'MISSING_DATA',
    description: 'Add-to-cart column absent from the export.',
    current: with_({ add_to_cart: null, checkout: null }),
    baseline: with_({ add_to_cart: null, checkout: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── CONV-001 · Conversion Bottleneck ───────────────────────────────────
  {
    id: 'CONV-001-positive-001',
    rule: 'CONV-001',
    category: 'POSITIVE',
    description: 'Conversion falls from 8.0% to 6.0% with corroborating funnel decline.',
    current: with_({ add_to_cart: 1_000, checkout: 700, orders: 600, gmv: 30_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED', confidence: 'HIGH', status: 'PROBLEM_DETECTED' },
  },
  {
    id: 'CONV-001-negative-001',
    rule: 'CONV-001',
    category: 'NEGATIVE',
    description: 'Conversion down 3.75% — inside the threshold.',
    current: with_({ orders: 770, gmv: 38_500 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'CONV-001-boundary-001',
    rule: 'CONV-001',
    category: 'BOUNDARY',
    description: 'Conversion down exactly 15%.',
    current: with_({ orders: 680, gmv: 34_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'CONV-001-suppressed-stockout-001',
    rule: 'CONV-001',
    category: 'SUPPRESSION',
    description: 'A recorded stockout overlapping the period suppresses the rule.',
    current: with_({ add_to_cart: 1_000, checkout: 700, orders: 600, gmv: 30_000 }),
    baseline: BASE,
    events: [stockoutEvent()],
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'STOCKOUT_CONFOUNDER' },
  },
  {
    id: 'CONV-001-insufficient-sample-001',
    rule: 'CONV-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Conversion halved but only 8 orders.',
    current: { traffic: 400, product_views: 200, add_to_cart: 25, checkout: 12, orders: 8, gmv: 400 },
    baseline: { traffic: 400, product_views: 200, add_to_cart: 40, checkout: 20, orders: 16, gmv: 800 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'CONV-001-missing-001',
    rule: 'CONV-001',
    category: 'MISSING_DATA',
    description: 'Orders absent — conversion cannot be computed.',
    current: with_({ orders: null }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED', status: 'INSUFFICIENT_EVIDENCE' },
  },

  // ── CONV-002 · High Traffic Low Conversion ─────────────────────────────
  {
    id: 'CONV-002-positive-001',
    rule: 'CONV-002',
    category: 'POSITIVE',
    description: 'Traffic up 25% while conversion falls 25%.',
    current: with_({
      traffic: 25_000,
      product_views: 12_500,
      add_to_cart: 1_400,
      checkout: 900,
      orders: 750,
      gmv: 37_500,
    }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'CONV-002-negative-001',
    rule: 'CONV-002',
    category: 'NEGATIVE',
    description: 'Traffic up 25% and conversion holds.',
    current: with_({
      traffic: 25_000,
      product_views: 12_500,
      add_to_cart: 1_500,
      checkout: 1_125,
      orders: 1_000,
      gmv: 50_000,
    }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'CONV-002-boundary-001',
    rule: 'CONV-002',
    category: 'BOUNDARY',
    description: 'Traffic exactly +15% and conversion exactly -20%.',
    current: with_({ traffic: 23_000, orders: 640, gmv: 32_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'CONV-002-suppressed-data-invalid-001',
    rule: 'CONV-002',
    category: 'SUPPRESSION',
    description: 'Add-to-cart exceeding product views invalidates the funnel.',
    current: with_({
      traffic: 25_000,
      product_views: 12_500,
      add_to_cart: 14_000,
      checkout: 900,
      orders: 750,
      gmv: 37_500,
    }),
    baseline: BASE,
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'DATA-INVALID' },
  },
  {
    id: 'CONV-002-insufficient-sample-001',
    rule: 'CONV-002',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Traffic up 25% and conversion halved, but only 8 orders.',
    current: { traffic: 500, product_views: 200, add_to_cart: 30, checkout: 12, orders: 8, gmv: 400 },
    baseline: { traffic: 400, product_views: 200, add_to_cart: 40, checkout: 20, orders: 16, gmv: 800 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'CONV-002-missing-001',
    rule: 'CONV-002',
    category: 'MISSING_DATA',
    description: 'Traffic absent — the traffic leg cannot be evaluated.',
    current: with_({ traffic: null }),
    baseline: with_({ traffic: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── AOV-001 · AOV Decline ──────────────────────────────────────────────
  {
    id: 'AOV-001-positive-001',
    rule: 'AOV-001',
    category: 'POSITIVE',
    description: 'Average order value falls from 50.00 to 40.00.',
    current: with_({ gmv: 32_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'AOV-001-negative-001',
    rule: 'AOV-001',
    category: 'NEGATIVE',
    description: 'Average order value down 5%.',
    current: with_({ gmv: 38_000 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'AOV-001-boundary-001',
    rule: 'AOV-001',
    category: 'BOUNDARY',
    description: 'Average order value down exactly 15%.',
    current: with_({ gmv: 34_000 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'AOV-001-insufficient-sample-001',
    rule: 'AOV-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Average order value halved on 8 orders.',
    current: { traffic: 400, product_views: 200, add_to_cart: 25, checkout: 12, orders: 8, gmv: 200 },
    baseline: { traffic: 400, product_views: 200, add_to_cart: 25, checkout: 12, orders: 8, gmv: 400 },
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'AOV-001-suppressed-data-invalid-001',
    rule: 'AOV-001',
    category: 'SUPPRESSION',
    description: 'Orders exceeding checkouts invalidates the funnel.',
    current: with_({ checkout: 700, orders: 800, gmv: 32_000 }),
    baseline: BASE,
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'DATA-INVALID' },
  },
  {
    id: 'AOV-001-missing-001',
    rule: 'AOV-001',
    category: 'MISSING_DATA',
    description: 'GMV absent — average order value cannot be computed.',
    current: with_({ gmv: null }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED', status: 'INSUFFICIENT_EVIDENCE' },
  },

  // ── ADS-001 · Efficiency Decline ───────────────────────────────────────
  {
    id: 'ADS-001-positive-001',
    rule: 'ADS-001',
    category: 'POSITIVE',
    description: 'Spend up 20% while paid ROAS falls from 4.00 to 3.00.',
    current: with_({ spend: 2_400, paid_gmv: 7_200 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ADS-001-negative-001',
    rule: 'ADS-001',
    category: 'NEGATIVE',
    description: 'Spend up 20% and paid revenue keeps pace.',
    current: with_({ spend: 2_400, paid_gmv: 9_600 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ADS-001-boundary-001',
    rule: 'ADS-001',
    category: 'BOUNDARY',
    description: 'Paid ROAS exactly -20% with spend exactly +10%.',
    current: with_({ spend: 2_200, paid_gmv: 7_040 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ADS-001-suppressed-attribution-001',
    rule: 'ADS-001',
    category: 'SUPPRESSION',
    description:
      'GMV Max gross revenue present without GMV Max cost makes the attribution picture incompatible.',
    current: with_({ spend: 2_400, paid_gmv: 7_200, gmvmax_cost: null }),
    baseline: with_({ gmvmax_cost: null }),
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'ATTRIBUTION-INCOMPATIBLE' },
  },
  {
    id: 'ADS-001-insufficient-sample-001',
    rule: 'ADS-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Efficiency halved but spend of 80 is below the minimum of 100.',
    current: with_({ spend: 80, paid_gmv: 160 }),
    baseline: with_({ spend: 60, paid_gmv: 240 }),
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ADS-001-missing-001',
    rule: 'ADS-001',
    category: 'MISSING_DATA',
    description: 'Paid GMV absent — paid ROAS must not be inferred from shop GMV.',
    current: with_({ paid_gmv: null }),
    baseline: with_({ paid_gmv: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── ADS-002 · Spend Growth Without Revenue Response ────────────────────
  {
    id: 'ADS-002-positive-001',
    rule: 'ADS-002',
    category: 'POSITIVE',
    description: 'Spend up 25% while paid GMV moves 2.5%.',
    current: with_({ spend: 2_500, paid_gmv: 8_200 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ADS-002-negative-001',
    rule: 'ADS-002',
    category: 'NEGATIVE',
    description: 'Spend up 25% and paid GMV up 25%.',
    current: with_({ spend: 2_500, paid_gmv: 10_000 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ADS-002-boundary-001',
    rule: 'ADS-002',
    category: 'BOUNDARY',
    description: 'Spend exactly +20% and paid GMV exactly +5%.',
    current: with_({ spend: 2_400, paid_gmv: 8_400 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ADS-002-suppressed-attribution-001',
    rule: 'ADS-002',
    category: 'SUPPRESSION',
    description:
      'GMV Max gross revenue present without GMV Max cost makes the attribution picture incompatible.',
    current: with_({ spend: 2_500, paid_gmv: 8_200, gmvmax_cost: null }),
    baseline: with_({ gmvmax_cost: null }),
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'ATTRIBUTION-INCOMPATIBLE' },
  },
  {
    id: 'ADS-002-insufficient-sample-001',
    rule: 'ADS-002',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Spend up 33% with flat paid GMV, but spend of 80 is below the minimum of 100.',
    current: with_({ spend: 80, paid_gmv: 240 }),
    baseline: with_({ spend: 60, paid_gmv: 240 }),
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ADS-002-missing-001',
    rule: 'ADS-002',
    category: 'MISSING_DATA',
    description: 'Spend absent from the export.',
    current: with_({ spend: null }),
    baseline: with_({ spend: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── GMVMAX-001 · ROI Decline With Gross Revenue Growth ─────────────────
  {
    id: 'GMVMAX-001-positive-001',
    rule: 'GMVMAX-001',
    category: 'POSITIVE',
    description: 'Gross revenue up 20% while GMV Max ROI falls from 4.00 to 3.00.',
    current: with_({ gross_revenue: 14_400, gmvmax_cost: 4_800, gmvmax_orders: 280 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'GMVMAX-001-negative-001',
    rule: 'GMVMAX-001',
    category: 'NEGATIVE',
    description: 'Gross revenue up 20% with ROI holding.',
    current: with_({ gross_revenue: 14_400, gmvmax_cost: 3_600, gmvmax_orders: 240 }),
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'GMVMAX-001-boundary-001',
    rule: 'GMVMAX-001',
    category: 'BOUNDARY',
    description: 'ROI exactly -20% with gross revenue exactly +10%.',
    current: with_({ gross_revenue: 13_200, gmvmax_cost: 4_125, gmvmax_orders: 220 }),
    baseline: BASE,
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'GMVMAX-001-suppressed-attribution-001',
    rule: 'GMVMAX-001',
    category: 'SUPPRESSION',
    description:
      'Ad spend present without paid-attributed GMV makes the attribution picture incompatible.',
    current: with_({
      gross_revenue: 14_400,
      gmvmax_cost: 4_800,
      gmvmax_orders: 280,
      paid_gmv: null,
    }),
    baseline: with_({ paid_gmv: null }),
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'ATTRIBUTION-INCOMPATIBLE' },
  },
  {
    id: 'GMVMAX-001-missing-001',
    rule: 'GMVMAX-001',
    category: 'MISSING_DATA',
    description:
      'GMV Max cost absent — ROI must not be computed by substituting generic ad spend.',
    current: with_({ gross_revenue: 14_400, gmvmax_cost: null }),
    baseline: with_({ gmvmax_cost: null }),
    expected: { outcome: 'NOT_EVALUABLE' },
  },

  // ── ANOM-001 · GMV Anomaly ─────────────────────────────────────────────
  {
    id: 'ANOM-001-positive-001',
    rule: 'ANOM-001',
    category: 'POSITIVE',
    description:
      'Final day GMV sits four standard deviations above a 14-day history with real dispersion.',
    current: BASE,
    baseline: BASE,
    dailyOverride: () => [
      ...buildVariedDays(BASELINE.start, BASELINE.end, {
        gmv: [2_900, 3_100],
        base: BASE,
      }),
      ...buildVariedDays(PERIOD.start, PERIOD.end, {
        gmv: [3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_400],
        base: BASE,
      }),
    ],
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ANOM-001-negative-001',
    rule: 'ANOM-001',
    category: 'NEGATIVE',
    description: 'Final day sits half a standard deviation from the mean.',
    current: BASE,
    baseline: BASE,
    dailyOverride: () => [
      ...buildVariedDays(BASELINE.start, BASELINE.end, {
        gmv: [2_900, 3_100],
        base: BASE,
      }),
      ...buildVariedDays(PERIOD.start, PERIOD.end, {
        gmv: [3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_050],
        base: BASE,
      }),
    ],
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'ANOM-001-boundary-001',
    rule: 'ANOM-001',
    category: 'BOUNDARY',
    description: 'Final day sits exactly three standard deviations above the mean.',
    current: BASE,
    baseline: BASE,
    dailyOverride: () => [
      ...buildVariedDays(BASELINE.start, BASELINE.end, {
        gmv: [2_900, 3_100],
        base: BASE,
      }),
      ...buildVariedDays(PERIOD.start, PERIOD.end, {
        gmv: [3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_300],
        base: BASE,
      }),
    ],
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'ANOM-001-suppressed-data-invalid-001',
    rule: 'ANOM-001',
    category: 'SUPPRESSION',
    description: 'An outlying day inside a funnel-inconsistent period is suppressed.',
    current: BASE,
    baseline: BASE,
    dailyOverride: () => [
      ...buildVariedDays(BASELINE.start, BASELINE.end, {
        gmv: [2_900, 3_100],
        base: BASE,
      }),
      ...buildVariedDays(PERIOD.start, PERIOD.end, {
        gmv: [3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_000, 3_400],
        // Add-to-cart above product views makes the whole period invalid.
        base: { ...BASE, product_views: 1_000, add_to_cart: 1_200 },
      }),
    ],
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'DATA-INVALID' },
  },
  {
    id: 'ANOM-001-insufficient-sample-001',
    rule: 'ANOM-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'A flat history has no dispersion, so no z-score exists.',
    current: BASE,
    baseline: BASE,
    expected: { outcome: 'NOT_TRIGGERED' },
  },

  // ── PROD-001 / PROD-002 · product grain ────────────────────────────────
  {
    id: 'PROD-001-positive-001',
    rule: 'PROD-001',
    category: 'POSITIVE',
    description: 'A high-view product converts 33% worse than in the comparison period.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 300, orders: 160, gmv: 8_000 },
      { product_key: 'SKU-B', product_views: 3_000, add_to_cart: 360, orders: 240, gmv: 12_000 },
    ],
    productsBaseline: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 480, orders: 240, gmv: 12_000 },
      { product_key: 'SKU-B', product_views: 3_000, add_to_cart: 360, orders: 240, gmv: 12_000 },
    ],
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'PROD-001-negative-001',
    rule: 'PROD-001',
    category: 'NEGATIVE',
    description: 'Product conversion is unchanged.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 480, orders: 240, gmv: 12_000 },
    ],
    productsBaseline: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 480, orders: 240, gmv: 12_000 },
    ],
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'PROD-001-insufficient-sample-001',
    rule: 'PROD-001',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Conversion halved on a product with only 90 views.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-C', product_views: 90, add_to_cart: 9, orders: 3, gmv: 150 },
    ],
    productsBaseline: [
      { product_key: 'SKU-C', product_views: 90, add_to_cart: 18, orders: 6, gmv: 300 },
    ],
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'PROD-001-boundary-001',
    rule: 'PROD-001',
    category: 'BOUNDARY',
    description: 'Product conversion down exactly 20% on 4,000 views.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 384, orders: 192, gmv: 9_600 },
    ],
    productsBaseline: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 480, orders: 240, gmv: 12_000 },
    ],
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'PROD-001-suppressed-stockout-001',
    rule: 'PROD-001',
    category: 'SUPPRESSION',
    description: 'A recorded stockout suppresses the product conversion finding.',
    current: BASE,
    baseline: BASE,
    events: [stockoutEvent()],
    productsCurrent: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 300, orders: 160, gmv: 8_000 },
    ],
    productsBaseline: [
      { product_key: 'SKU-A', product_views: 4_000, add_to_cart: 480, orders: 240, gmv: 12_000 },
    ],
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'STOCKOUT_CONFOUNDER' },
  },
  {
    id: 'PROD-001-missing-001',
    rule: 'PROD-001',
    category: 'MISSING_DATA',
    description: 'No product-grain rows were imported.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [],
    productsBaseline: [],
    expected: { outcome: 'NOT_EVALUABLE' },
  },
  {
    id: 'PROD-002-positive-001',
    rule: 'PROD-002',
    category: 'POSITIVE',
    description: 'A product converts 25% better while views fall 37.5%.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-D', product_views: 2_500, add_to_cart: 300, orders: 250, gmv: 12_500 },
    ],
    productsBaseline: [
      { product_key: 'SKU-D', product_views: 4_000, add_to_cart: 480, orders: 320, gmv: 16_000 },
    ],
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'PROD-002-negative-001',
    rule: 'PROD-002',
    category: 'NEGATIVE',
    description: 'Conversion improves but views hold steady.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-D', product_views: 4_000, add_to_cart: 480, orders: 400, gmv: 20_000 },
    ],
    productsBaseline: [
      { product_key: 'SKU-D', product_views: 4_000, add_to_cart: 480, orders: 320, gmv: 16_000 },
    ],
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'PROD-002-boundary-001',
    rule: 'PROD-002',
    category: 'BOUNDARY',
    description: 'Conversion up exactly 15% while views fall exactly 20%.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-D', product_views: 3_200, add_to_cart: 400, orders: 368, gmv: 18_400 },
    ],
    productsBaseline: [
      { product_key: 'SKU-D', product_views: 4_000, add_to_cart: 480, orders: 400, gmv: 20_000 },
    ],
    expected: { outcome: 'TRIGGERED' },
  },
  {
    id: 'PROD-002-insufficient-sample-001',
    rule: 'PROD-002',
    category: 'INSUFFICIENT_SAMPLE',
    description: 'Conversion up and views down, but only 90 views.',
    current: BASE,
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-E', product_views: 90, add_to_cart: 20, orders: 18, gmv: 900 },
    ],
    productsBaseline: [
      { product_key: 'SKU-E', product_views: 200, add_to_cart: 30, orders: 20, gmv: 1_000 },
    ],
    expected: { outcome: 'NOT_TRIGGERED' },
  },
  {
    id: 'PROD-002-suppressed-data-invalid-001',
    rule: 'PROD-002',
    category: 'SUPPRESSION',
    description: 'A funnel-inconsistent shop period suppresses the product opportunity.',
    current: with_({ product_views: 1_000, add_to_cart: 1_200 }),
    baseline: BASE,
    productsCurrent: [
      { product_key: 'SKU-D', product_views: 2_500, add_to_cart: 300, orders: 250, gmv: 12_500 },
    ],
    productsBaseline: [
      { product_key: 'SKU-D', product_views: 4_000, add_to_cart: 480, orders: 320, gmv: 16_000 },
    ],
    expected: { outcome: 'SUPPRESSED', suppression_reason: 'DATA-INVALID' },
  },
]

/** Materialises a vector into the exact inputs `runAnalysis` consumes. */
export function materialise(vector: GoldenVector): {
  dailyRows: DailyMetricRow[]
  productRows: DailyProductMetricRow[]
  events: BusinessEvent[]
} {
  const dailyRows = vector.dailyOverride
    ? vector.dailyOverride()
    : [
        ...buildDays(BASELINE.start, BASELINE.end, vector.baseline),
        ...buildDays(PERIOD.start, PERIOD.end, vector.current),
      ]

  const productRows = [
    ...buildProductDays(BASELINE.start, BASELINE.end, vector.productsBaseline ?? []),
    ...buildProductDays(PERIOD.start, PERIOD.end, vector.productsCurrent ?? []),
  ]

  return { dailyRows, productRows, events: vector.events ?? [] }
}
