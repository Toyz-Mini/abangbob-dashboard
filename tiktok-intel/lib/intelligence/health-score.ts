/**
 * Health score.
 *
 * Dimension weights are fixed by 03_INTELLIGENCE/HEALTH_SCORE_SPEC.md:
 *   Traffic 20%, Conversion 30%, Product 20%, Ads 20%, Growth 10%.
 * A dimension with no data is reweighted out, never scored zero.
 *
 * The mapping from a metric change to a 0..1 dimension score is not specified
 * by the contracts, so it is a declared implementation decision recorded in
 * CONTRACT_LOCK_REPORT.md (DECISION-003): a symmetric band where a 50% decline
 * scores 0, no change scores 0.5, and a 50% improvement scores 1.
 */

import type { ConfidenceLabel, HealthScore } from '../contracts/types'
import { HEALTH_SCORE_VERSION } from '../contracts/versions'
import type { ChangeSet, ProductPeriodMetrics } from '../metrics/period'

/** Change magnitude that saturates a dimension score at 0 or 1. */
const BAND = 0.5

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/** Maps a proportional change to a 0..1 score. Null change → null score. */
export function scoreFromChange(changePct: number | null): number | null {
  if (changePct === null) return null
  return clamp01(0.5 + changePct / (2 * BAND))
}

const BASE_WEIGHTS = {
  TRAFFIC: 0.2,
  CONVERSION: 0.3,
  PRODUCT: 0.2,
  ADS: 0.2,
  GROWTH: 0.1,
} as const

export interface HealthInput {
  changes: ChangeSet
  productsCurrent: ProductPeriodMetrics[]
  productsBaseline: ProductPeriodMetrics[]
  /** Overall metric completeness of the analysis, 0..1. */
  dataCoverage: number
}

/**
 * Product dimension: GMV-weighted mean of per-product conversion change.
 * Weighting by GMV keeps a long tail of tiny products from outvoting the
 * products that actually carry the shop.
 */
function productDimension(
  current: ProductPeriodMetrics[],
  baseline: ProductPeriodMetrics[],
): number | null {
  if (current.length === 0) return null
  const baselineByKey = new Map(baseline.map((p) => [p.product_key, p]))

  let weightedSum = 0
  let weightTotal = 0

  for (const product of current) {
    const prior = baselineByKey.get(product.product_key)
    if (!prior || product.cvr === null || prior.cvr === null || prior.cvr === 0) continue
    const weight = product.gmv ?? 0
    if (weight <= 0) continue
    const changePct = (product.cvr - prior.cvr) / Math.abs(prior.cvr)
    const score = scoreFromChange(changePct)
    if (score === null) continue
    weightedSum += score * weight
    weightTotal += weight
  }

  return weightTotal === 0 ? null : clamp01(weightedSum / weightTotal)
}

function labelFor(score: number): NonNullable<HealthScore['label']> {
  if (score < 0.2) return 'CRITICAL'
  if (score < 0.4) return 'AT_RISK'
  if (score < 0.6) return 'FAIR'
  if (score < 0.8) return 'GOOD'
  return 'STRONG'
}

function confidenceFor(coverage: number, availableDimensions: number): ConfidenceLabel {
  if (availableDimensions <= 2 || coverage < 0.5) return 'LOW'
  if (availableDimensions < 5 || coverage < 0.8) return 'MEDIUM'
  return 'HIGH'
}

export function computeHealthScore(input: HealthInput): HealthScore {
  const raw: Array<{ id: keyof typeof BASE_WEIGHTS; score: number | null }> = [
    { id: 'TRAFFIC', score: scoreFromChange(input.changes.get('traffic').change_pct) },
    { id: 'CONVERSION', score: scoreFromChange(input.changes.get('cvr').change_pct) },
    { id: 'PRODUCT', score: productDimension(input.productsCurrent, input.productsBaseline) },
    { id: 'ADS', score: scoreFromChange(input.changes.get('ad_roi').change_pct) },
    { id: 'GROWTH', score: scoreFromChange(input.changes.get('gmv').change_pct) },
  ]

  const availableWeight = raw
    .filter((d) => d.score !== null)
    .reduce((sum, d) => sum + BASE_WEIGHTS[d.id], 0)

  const dimensions = raw.map((d) => ({
    id: d.id,
    score: d.score,
    // Reweighted share of the total, so present dimensions absorb the weight
    // of absent ones rather than absent ones dragging the score down.
    weight: d.score === null || availableWeight === 0 ? 0 : BASE_WEIGHTS[d.id] / availableWeight,
    available: d.score !== null,
  }))

  if (availableWeight === 0) {
    return {
      score: null,
      label: null,
      dimensions,
      data_coverage: input.dataCoverage,
      confidence: 'LOW',
      version: HEALTH_SCORE_VERSION,
    }
  }

  const score = dimensions.reduce(
    (sum, d) => (d.score === null ? sum : sum + d.score * d.weight),
    0,
  )
  const rounded = Math.round(clamp01(score) * 1000) / 1000

  return {
    score: rounded,
    label: labelFor(rounded),
    dimensions,
    data_coverage: input.dataCoverage,
    confidence: confidenceFor(input.dataCoverage, dimensions.filter((d) => d.available).length),
    version: HEALTH_SCORE_VERSION,
  }
}
