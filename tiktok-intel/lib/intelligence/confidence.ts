/**
 * Confidence scoring.
 *
 * Weights are fixed by 03_INTELLIGENCE/CONFIDENCE_MODEL.md:
 *   30% data completeness, 30% signal strength, 25% cross-signal agreement,
 *   15% sample sufficiency.
 *
 * Confidence expresses evidence quality, not the probability that the
 * hypothesis is causally true (03_INTELLIGENCE/DECISION_CONTRACT.md).
 */

import type { ConfidenceBreakdown, ConfidenceLabel } from '../contracts/types'
import { CONFIDENCE_MODEL_VERSION } from '../contracts/versions'
import {
  METRIC_REGISTRY,
  type AdditiveMetric,
  type CanonicalMetric,
} from '../metrics/registry'
import type { PeriodMetrics } from '../metrics/period'

export const CONFIDENCE_WEIGHTS = {
  data_completeness: 0.3,
  signal_strength: 0.3,
  cross_signal_agreement: 0.25,
  sample_sufficiency: 0.15,
} as const

/**
 * Score used when a component cannot be measured at all. Neutral rather than
 * zero: an unmeasurable component is not evidence of poor quality, and scoring
 * it zero would silently suppress otherwise sound diagnoses.
 */
const NEUTRAL = 0.5

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/** Expands derived metrics into the additive components they are computed from. */
function additiveComponents(metrics: CanonicalMetric[]): AdditiveMetric[] {
  const out = new Set<AdditiveMetric>()
  for (const metric of metrics) {
    const definition = METRIC_REGISTRY[metric]
    if (definition.kind === 'ADDITIVE') {
      out.add(metric as AdditiveMetric)
      continue
    }
    if (definition.numerator) out.add(definition.numerator)
    if (definition.denominator) out.add(definition.denominator)
  }
  return [...out]
}

export function dataCompleteness(
  current: PeriodMetrics,
  baseline: PeriodMetrics,
  requiredMetrics: CanonicalMetric[],
): number {
  const components = additiveComponents(requiredMetrics)
  if (components.length === 0) return NEUTRAL

  const scores = components.map((metric) =>
    Math.min(
      current.coverage.metric_completeness[metric] ?? 0,
      baseline.coverage.metric_completeness[metric] ?? 0,
    ),
  )
  return clamp01(scores.reduce((a, b) => a + b, 0) / scores.length)
}

/**
 * How far past its threshold the signal sits.
 *
 * Exactly at the threshold scores 0.5; twice the threshold or beyond scores
 * 1.0. A signal that barely crosses its trigger should not read as strong.
 */
export function signalStrength(
  changePct: number | null,
  threshold: number | null,
): number {
  if (changePct === null || threshold === null || threshold === 0) return NEUTRAL
  return clamp01(0.5 * (Math.abs(changePct) / Math.abs(threshold)))
}

/**
 * Share of corroborating signals that move in the direction the diagnosis
 * predicts. With no corroborating signals available the component is neutral.
 */
export function crossSignalAgreement(
  signals: Array<{ agrees: boolean }>,
): number {
  if (signals.length === 0) return NEUTRAL
  return clamp01(signals.filter((s) => s.agrees).length / signals.length)
}

/**
 * Sample sufficiency relative to the rule's minimum gate. Three times the
 * minimum is treated as fully sufficient.
 */
export function sampleSufficiency(
  actual: number | null,
  minimum: number | null,
): number {
  if (actual === null || minimum === null || minimum <= 0) return NEUTRAL
  return clamp01(actual / (3 * minimum))
}

export function labelFor(score: number): ConfidenceLabel {
  if (score >= 0.7) return 'HIGH'
  if (score >= 0.4) return 'MEDIUM'
  return 'LOW'
}

export interface ConfidenceInput {
  data_completeness: number
  signal_strength: number
  cross_signal_agreement: number
  sample_sufficiency: number
}

export function scoreConfidence(input: ConfidenceInput): ConfidenceBreakdown {
  const score =
    input.data_completeness * CONFIDENCE_WEIGHTS.data_completeness +
    input.signal_strength * CONFIDENCE_WEIGHTS.signal_strength +
    input.cross_signal_agreement * CONFIDENCE_WEIGHTS.cross_signal_agreement +
    input.sample_sufficiency * CONFIDENCE_WEIGHTS.sample_sufficiency

  const rounded = Math.round(clamp01(score) * 100_000) / 100_000
  return {
    score: rounded,
    label: labelFor(rounded),
    components: { ...input },
    model_version: CONFIDENCE_MODEL_VERSION,
  }
}
