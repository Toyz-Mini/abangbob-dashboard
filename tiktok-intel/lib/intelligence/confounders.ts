/**
 * Confounder detection.
 *
 * Runs before rule evaluation. A detected confounder suppresses every rule
 * that lists it (03_INTELLIGENCE/P0_RULE_CATALOG_V1.json — `suppression`), so
 * the engine never issues a recommendation whose premise it already knows to
 * be contaminated.
 *
 * A detector that cannot run is reported as `evaluated: false` and becomes a
 * stated limitation. It is never reported as "no confounder found" — that
 * would be a fabricated clearance.
 */

import type { ConfounderFinding } from '../contracts/types'
import type { PeriodMetrics } from '../metrics/period'
import type { ResolvedBaseline } from './baseline'

/** A row of `business_events` overlapping the analysis period. */
export interface BusinessEvent {
  event_type: string
  name: string
  start_at: string
  end_at: string
  scope_json: Record<string, unknown>
}

export interface ConfounderInput {
  current: PeriodMetrics
  baseline: PeriodMetrics
  events: BusinessEvent[]
  baselineInfo: ResolvedBaseline
  /** Validation errors carried forward from the import that fed this analysis. */
  importValidationErrors: string[]
}

/**
 * Funnel stages must be non-increasing: a shopper cannot order without
 * checking out, check out without adding to cart, or add to cart without
 * viewing the product. A violation means the sources disagree and no
 * conversion diagnosis can be trusted.
 */
function funnelViolations(period: PeriodMetrics): string[] {
  const { product_views: views, add_to_cart: atc, checkout, orders } = period.totals
  const violations: string[] = []

  const check = (
    upperName: string,
    upper: number | null,
    lowerName: string,
    lower: number | null,
  ) => {
    if (upper === null || lower === null) return
    if (lower > upper) {
      violations.push(
        `${lowerName} (${lower}) exceeds ${upperName} (${upper}) — funnel stages are inconsistent.`,
      )
    }
  }

  check('product_views', views, 'add_to_cart', atc)
  check('add_to_cart', atc, 'checkout', checkout)
  check('checkout', checkout, 'orders', orders)
  return violations
}

function negativeValues(period: PeriodMetrics): string[] {
  const problems: string[] = []
  for (const [metric, value] of Object.entries(period.totals)) {
    if (value !== null && value < 0) {
      problems.push(`${metric} is negative (${value}).`)
    }
  }
  return problems
}

function detectDataInvalid(input: ConfounderInput): ConfounderFinding {
  const problems = [
    ...input.importValidationErrors,
    ...funnelViolations(input.current),
    ...funnelViolations(input.baseline),
    ...negativeValues(input.current),
    ...negativeValues(input.baseline),
  ]

  if (input.current.coverage.observed_days === 0) {
    problems.push('No normalized rows exist inside the analysis period.')
  }
  if (input.baseline.coverage.observed_days === 0) {
    problems.push('No normalized rows exist inside the comparison period.')
  }
  if (!input.baselineInfo.comparison_valid && input.baselineInfo.invalid_reason) {
    problems.push(input.baselineInfo.invalid_reason)
  }

  return {
    id: 'DATA-INVALID',
    detected: problems.length > 0,
    reason: problems.length > 0 ? problems[0]! : '',
    detail: { problems },
    evaluated: true,
  }
}

/**
 * Stockout detection.
 *
 * The contracted schema carries no stock or inventory field, so automatic
 * detection from stock levels is not possible. The only authoritative signal
 * available is a user-recorded `business_events` row, which is what this
 * detector reads. When no stockout event exists we cannot conclude that no
 * stockout occurred, so the absence is reported as a limitation.
 * See CONTRACT_LOCK_REPORT.md (GAP-003).
 */
const STOCKOUT_EVENT_TYPES = new Set(['STOCKOUT', 'OUT_OF_STOCK', 'INVENTORY_GAP'])

function detectStockout(input: ConfounderInput): ConfounderFinding {
  const periodStart = `${input.current.start}T00:00:00Z`
  const periodEnd = `${input.current.end}T23:59:59Z`

  const overlapping = input.events.filter(
    (event) =>
      STOCKOUT_EVENT_TYPES.has(event.event_type.toUpperCase()) &&
      event.start_at <= periodEnd &&
      event.end_at >= periodStart,
  )

  return {
    id: 'STOCKOUT_CONFOUNDER',
    detected: overlapping.length > 0,
    reason:
      overlapping.length > 0
        ? `${overlapping.length} recorded stockout event(s) overlap this period: ${overlapping
            .map((e) => e.name)
            .join(', ')}.`
        : '',
    detail: {
      events: overlapping,
      detection_source: 'business_events',
      note: 'Stock levels are not present in the contracted schema; only user-recorded events are visible to this detector.',
    },
    evaluated: true,
  }
}

/**
 * Attribution incompatibility.
 *
 * Triggers when a rule would otherwise be forced to compute an
 * attribution-specific metric from a total that carries a different
 * attribution context — the exact substitution
 * 02_DATA/METRIC_SEMANTIC_GUARDRAILS.md prohibits.
 */
function detectAttributionIncompatible(input: ConfounderInput): ConfounderFinding {
  const problems: string[] = []
  const { totals } = input.current

  if (totals.spend !== null && totals.paid_gmv === null) {
    problems.push(
      'Ad spend is present but paid-attributed GMV is not. Paid ROAS cannot be computed from shop-total GMV.',
    )
  }
  if (totals.gross_revenue !== null && totals.gmvmax_cost === null) {
    problems.push(
      'GMV Max gross revenue is present but GMV Max cost is not. GMV Max ROI cannot be computed, and generic ad spend must not be substituted.',
    )
  }
  if (totals.gmvmax_cost !== null && totals.gross_revenue === null) {
    problems.push(
      'GMV Max cost is present but GMV Max gross revenue is not. GMV Max ROI cannot be computed, and shop-total GMV must not be substituted.',
    )
  }

  return {
    id: 'ATTRIBUTION-INCOMPATIBLE',
    detected: problems.length > 0,
    reason: problems.length > 0 ? problems[0]! : '',
    detail: { problems },
    evaluated: true,
  }
}

export function detectConfounders(input: ConfounderInput): ConfounderFinding[] {
  return [
    detectDataInvalid(input),
    detectStockout(input),
    detectAttributionIncompatible(input),
  ]
}

export function isDetected(
  findings: ConfounderFinding[],
  id: ConfounderFinding['id'],
): boolean {
  return findings.some((f) => f.id === id && f.detected)
}

export function findingFor(
  findings: ConfounderFinding[],
  id: ConfounderFinding['id'],
): ConfounderFinding | undefined {
  return findings.find((f) => f.id === id)
}
