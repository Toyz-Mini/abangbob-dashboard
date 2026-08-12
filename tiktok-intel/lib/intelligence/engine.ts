/**
 * Diagnostic engine orchestrator.
 *
 * Pipeline, per 03_INTELLIGENCE/DIAGNOSTIC_ENGINE_SPEC.md:
 *   normalized data → metric engine → baseline → signal detection →
 *   confounder detection → rule evaluation → suppression/precedence →
 *   priority → decision contract.
 *
 * The function is pure. Given identical normalized rows, events and period
 * bounds it returns an identical AnalysisResult — which is what lets an
 * analysis snapshot be replayed and audited.
 */

import { SPEC_INCOMPLETE_RULES } from '../contracts/rule-catalog'
import type { AnalysisResult, DecisionStatus, Diagnosis } from '../contracts/types'
import {
  DIAGNOSTIC_ENGINE_VERSION,
  METRIC_VERSION,
  RULE_SET_VERSION,
} from '../contracts/versions'
import {
  aggregatePeriod,
  aggregateProducts,
  buildChangeSet,
  MixedCurrencyError,
  type DailyMetricRow,
  type DailyProductMetricRow,
} from '../metrics/period'
import { anomalyHistoryWindow, resolveBaseline, type ComparisonType } from './baseline'
import { detectConfounders, isDetected, type BusinessEvent } from './confounders'
import { computeHealthScore } from './health-score'
import { comparePriority } from './priority'
import { evaluateRules, type RuleContext } from './rules'

export interface AnalysisInput {
  period_start: string
  period_end: string
  comparison?: { type: ComparisonType; start?: string; end?: string }
  /** All normalized daily rows available for the shop, any date. */
  dailyRows: DailyMetricRow[]
  productRows: DailyProductMetricRow[]
  events: BusinessEvent[]
  /** Validation errors carried forward from the imports feeding this analysis. */
  importValidationErrors?: string[]
  currency: string
}

/**
 * Funnel metrics without which no meaningful analysis exists. Their absence is
 * DATA-001 and terminates the analysis as INSUFFICIENT_EVIDENCE rather than
 * producing partial diagnoses.
 */
const REQUIRED_FUNNEL_METRICS = ['product_views', 'orders', 'gmv'] as const

export function runAnalysis(input: AnalysisInput): AnalysisResult {
  const unevaluatedRules = SPEC_INCOMPLETE_RULES.map((rule) => ({
    rule_id: rule.id,
    reason: rule.spec_gap ?? 'No implementable specification.',
  }))

  const versions = {
    metric_version: METRIC_VERSION,
    rule_set_version: RULE_SET_VERSION,
    diagnostic_engine_version: DIAGNOSTIC_ENGINE_VERSION,
  }

  const baselineInfo = resolveBaseline(
    input.period_start,
    input.period_end,
    input.comparison,
  )

  let current
  let baseline
  try {
    current = aggregatePeriod(input.dailyRows, input.period_start, input.period_end, input.currency)
    baseline = aggregatePeriod(input.dailyRows, baselineInfo.start, baselineInfo.end, input.currency)
  } catch (error) {
    if (error instanceof MixedCurrencyError) {
      // A mixed-currency period cannot be aggregated at all, so the analysis
      // terminates before any metric is computed.
      return terminal('DATA_INVALID', [error.message], unevaluatedRules, versions)
    }
    throw error
  }

  // ── DATA-001 · required funnel metrics present? ────────────────────────
  const missingFunnel = REQUIRED_FUNNEL_METRICS.filter(
    (metric) => current.totals[metric] === null,
  )
  if (missingFunnel.length > 0) {
    return terminal(
      'INSUFFICIENT_EVIDENCE',
      [
        `DATA-001 — required funnel metrics are missing for the analysis period: ${missingFunnel.join(', ')}. No diagnosis can be produced from this data.`,
      ],
      unevaluatedRules,
      versions,
    )
  }

  const changes = buildChangeSet(current, baseline)

  const productsCurrent = aggregateProducts(
    input.productRows,
    input.period_start,
    input.period_end,
  )
  const productsBaseline = aggregateProducts(
    input.productRows,
    baselineInfo.start,
    baselineInfo.end,
  )

  const historyWindow = anomalyHistoryWindow(input.period_start)
  const history = input.dailyRows.filter(
    (row) => row.business_date >= historyWindow.start && row.business_date <= historyWindow.end,
  )

  const confounders = detectConfounders({
    current,
    baseline,
    events: input.events,
    baselineInfo,
    importValidationErrors: input.importValidationErrors ?? [],
  })

  const ctx: RuleContext = {
    current,
    baseline,
    changes,
    baselineInfo,
    confounders,
    productsCurrent,
    productsBaseline,
    history,
    currency: current.currency,
  }

  const outcomes = evaluateRules(ctx)

  const diagnoses: Diagnosis[] = []
  const suppressed: AnalysisResult['suppressed'] = []
  const limitations: string[] = []

  for (const outcome of outcomes) {
    switch (outcome.kind) {
      case 'TRIGGERED':
        diagnoses.push(outcome.diagnosis)
        break
      case 'SUPPRESSED':
        suppressed.push({
          rule_id: outcome.rule_id,
          rule_name: outcome.rule_name,
          suppressed: true,
          suppression_reason: outcome.confounder,
          detail: outcome.detail,
        })
        break
      case 'NOT_EVALUABLE':
        limitations.push(`${outcome.rule_id} could not be evaluated: ${outcome.reason}`)
        break
      case 'NOT_TRIGGERED':
        break
    }
  }

  diagnoses.sort(comparePriority)

  const dataCoverage =
    current.coverage.expected_days === 0
      ? 0
      : current.coverage.observed_days / current.coverage.expected_days

  const health = computeHealthScore({
    changes,
    productsCurrent,
    productsBaseline,
    dataCoverage,
  })

  // ── status resolution ──────────────────────────────────────────────────
  // DATA_INVALID outranks everything: if the inputs are contradictory, no
  // diagnosis drawn from them can be trusted.
  let status: DecisionStatus
  if (isDetected(confounders, 'DATA-INVALID')) {
    status = 'DATA_INVALID'
  } else if (diagnoses.length === 0) {
    status = 'HEALTHY'
  } else if (diagnoses.every((d) => d.status === 'ANOMALY')) {
    status = 'ANOMALY'
  } else {
    status = 'PROBLEM_DETECTED'
  }

  if (status === 'DATA_INVALID') {
    const finding = confounders.find((f) => f.id === 'DATA-INVALID')
    const problems = (finding?.detail.problems as string[] | undefined) ?? []
    limitations.push(...problems)
  }

  if (dataCoverage < 1) {
    limitations.push(
      `The analysis period covers ${current.coverage.observed_days} of ${current.coverage.expected_days} days. Totals understate the full period.`,
    )
  }

  if (unevaluatedRules.length > 0) {
    limitations.push(
      `${unevaluatedRules.length} rules declared in MVP P0 scope have no implementable specification and were not evaluated. See CONTRACT_LOCK_REPORT.md (CONFLICT-001).`,
    )
  }

  return {
    status,
    // A DATA_INVALID analysis exposes no primary diagnosis; acting on one
    // would contradict the status.
    primary: status === 'DATA_INVALID' ? null : (diagnoses[0] ?? null),
    diagnoses: status === 'DATA_INVALID' ? [] : diagnoses,
    suppressed,
    confounders,
    health,
    limitations,
    unevaluated_rules: unevaluatedRules,
    versions,
  }
}

function terminal(
  status: DecisionStatus,
  limitations: string[],
  unevaluatedRules: AnalysisResult['unevaluated_rules'],
  versions: AnalysisResult['versions'],
): AnalysisResult {
  return {
    status,
    primary: null,
    diagnoses: [],
    suppressed: [],
    confounders: [],
    health: {
      score: null,
      label: null,
      dimensions: [],
      data_coverage: 0,
      confidence: 'LOW',
      version: '1.0.0',
    },
    limitations,
    unevaluated_rules: unevaluatedRules,
    versions,
  }
}

/**
 * Stable hash of the normalized rows an analysis consumed. Persisted on the
 * snapshot so a replay can prove it ran against identical data.
 */
export function normalizedDataHash(
  dailyRows: DailyMetricRow[],
  productRows: DailyProductMetricRow[],
): string {
  const canonical = JSON.stringify({
    daily: [...dailyRows].sort((a, b) => a.business_date.localeCompare(b.business_date)),
    product: [...productRows].sort(
      (a, b) =>
        a.product_key.localeCompare(b.product_key) ||
        a.business_date.localeCompare(b.business_date),
    ),
  })

  // FNV-1a, 64-bit, expressed as hex. Deterministic across platforms and
  // dependency-free.
  let hash = 0xcbf29ce484222325n
  const prime = 0x100000001b3n
  const mask = 0xffffffffffffffffn
  for (let i = 0; i < canonical.length; i += 1) {
    hash = ((hash ^ BigInt(canonical.charCodeAt(i))) * prime) & mask
  }
  return hash.toString(16).padStart(16, '0')
}
