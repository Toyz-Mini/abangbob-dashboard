/**
 * Deterministic rule evaluation.
 *
 * Every trigger below is transcribed from
 * `03_INTELLIGENCE/P0_RULE_CATALOG_V1.json` and cross-checked against the
 * `trigger_text` recorded on each RuleSpec. No rule may live only in a UI
 * component (CLAUDE.md — non-negotiable rules).
 *
 * Evaluation order per rule:
 *   1. required metrics present?   → otherwise NOT_EVALUABLE
 *   2. minimum sample gate met?    → otherwise NOT_TRIGGERED
 *   3. trigger expression true?    → otherwise NOT_TRIGGERED
 *   4. any listed confounder detected? → SUPPRESSED
 *   5. build evidence, confidence, priority, recommendation → TRIGGERED
 *
 * Suppression is checked after the trigger so that a suppressed rule is one
 * that genuinely would have fired, which is what the golden vectors assert.
 */

import { getRule, IMPLEMENTED_RULES, type RuleSpec } from '../contracts/rule-catalog'
import type {
  ConfounderFinding,
  ConfounderId,
  Diagnosis,
  EvidenceItem,
} from '../contracts/types'
import {
  METRIC_LABELS,
  METRIC_REGISTRY,
  type CanonicalMetric,
} from '../metrics/registry'
import {
  readMetric,
  zScoreOfLatest,
  type ChangeSet,
  type DailyMetricRow,
  type MetricChange,
  type PeriodMetrics,
  type ProductPeriodMetrics,
} from '../metrics/period'
import type { ResolvedBaseline } from './baseline'
import { isDetected } from './confounders'
import {
  crossSignalAgreement,
  dataCompleteness,
  sampleSufficiency,
  scoreConfidence,
  signalStrength,
} from './confidence'
import { scorePriority } from './priority'
import { recommendationsFor } from './recommendations'
import { atLeast, atMost, below } from './threshold'

export interface RuleContext {
  current: PeriodMetrics
  baseline: PeriodMetrics
  changes: ChangeSet
  baselineInfo: ResolvedBaseline
  confounders: ConfounderFinding[]
  productsCurrent: ProductPeriodMetrics[]
  productsBaseline: ProductPeriodMetrics[]
  /** Daily rows preceding the analysis period, for anomaly detection. */
  history: DailyMetricRow[]
  currency: string
}

export type RuleOutcome =
  | { kind: 'TRIGGERED'; diagnosis: Diagnosis }
  | { kind: 'NOT_TRIGGERED'; rule_id: string; reason: string }
  | {
      kind: 'SUPPRESSED'
      rule_id: string
      rule_name: string
      confounder: ConfounderId
      detail: string
    }
  | {
      kind: 'NOT_EVALUABLE'
      rule_id: string
      reason: string
      missing: CanonicalMetric[]
    }

// ── shared helpers ────────────────────────────────────────────────────────

const pct = (value: number | null): string =>
  value === null ? 'n/a' : `${(value * 100).toFixed(1)}%`

const num = (value: number | null, digits = 0): string =>
  value === null ? 'n/a' : value.toLocaleString('en-US', { maximumFractionDigits: digits })

const money = (value: number | null, currency: string): string =>
  value === null ? 'n/a' : `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

function missingMetrics(ctx: RuleContext, rule: RuleSpec): CanonicalMetric[] {
  return rule.required_metrics.filter(
    (metric) =>
      readMetric(ctx.current, metric) === null || readMetric(ctx.baseline, metric) === null,
  )
}

function suppressingConfounder(
  ctx: RuleContext,
  rule: RuleSpec,
): { id: ConfounderId; detail: string } | null {
  for (const id of rule.suppression) {
    if (isDetected(ctx.confounders, id)) {
      const finding = ctx.confounders.find((f) => f.id === id)
      return { id, detail: finding?.reason ?? '' }
    }
  }
  return null
}

function evidenceFrom(
  ruleId: string,
  change: MetricChange,
  threshold: number | null,
  extra: Record<string, unknown> = {},
): EvidenceItem {
  return {
    rule_id: ruleId,
    metric_name: change.metric,
    current_value: change.current,
    baseline_value: change.baseline,
    change_pct: change.change_pct,
    threshold,
    attribution: METRIC_REGISTRY[change.metric].attribution,
    evidence_json: { comparable: change.comparable, ...extra },
  }
}

/** Limitations every observational diagnosis must carry. */
function baseLimitations(ctx: RuleContext, rule: RuleSpec): string[] {
  const limitations: string[] = [
    'This is an observational finding from uploaded reports. It identifies what moved together, not what caused what.',
  ]

  const stockout = ctx.confounders.find((f) => f.id === 'STOCKOUT_CONFOUNDER')
  if (rule.suppression.includes('STOCKOUT_CONFOUNDER') && stockout && !stockout.detected) {
    limitations.push(
      'Stock levels are not present in the uploaded data. A stockout can only be ruled out if it was recorded as a business event.',
    )
  }

  if (ctx.current.coverage.observed_days < ctx.current.coverage.expected_days) {
    limitations.push(
      `The analysis period has ${ctx.current.coverage.observed_days} of ${ctx.current.coverage.expected_days} days of data. Totals understate the full period.`,
    )
  }
  if (!ctx.baselineInfo.comparison_valid && ctx.baselineInfo.invalid_reason) {
    limitations.push(ctx.baselineInfo.invalid_reason)
  }
  return limitations
}

interface DiagnosisDraft {
  rule: RuleSpec
  observation: string
  diagnosis: string
  hypothesis: string
  dont_touch: string
  monitor: { metrics: string[]; window_days: number; note: string }
  evidence: EvidenceItem[]
  /** Signals that corroborate or contradict the primary reading. */
  corroborating: Array<{ agrees: boolean }>
  signalChangePct: number | null
  sampleActual: number | null
  impactValue: number | null
  extraLimitations?: string[]
}

function buildDiagnosis(ctx: RuleContext, draft: DiagnosisDraft): Diagnosis {
  const { rule } = draft

  const confidence = scoreConfidence({
    data_completeness: dataCompleteness(ctx.current, ctx.baseline, rule.required_metrics),
    signal_strength: signalStrength(draft.signalChangePct, rule.primary_threshold),
    cross_signal_agreement: crossSignalAgreement(draft.corroborating),
    sample_sufficiency: sampleSufficiency(
      draft.sampleActual,
      rule.minimum_sample?.value ?? null,
    ),
  })

  const priority = scorePriority({
    severity: rule.severity,
    confidence: confidence.score,
    impactValue: draft.impactValue,
    baselineGmv: ctx.baseline.totals.gmv,
    currency: ctx.currency,
  })

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    status: rule.family === 'ANOM' ? 'ANOMALY' : 'PROBLEM_DETECTED',
    severity: rule.severity,
    confidence,
    priority,
    observation: draft.observation,
    diagnosis: draft.diagnosis,
    hypothesis: draft.hypothesis,
    dont_touch: draft.dont_touch,
    monitor: draft.monitor,
    limitations: [...baseLimitations(ctx, rule), ...(draft.extraLimitations ?? [])],
    evidence: draft.evidence,
    recommendations: recommendationsFor(rule.id),
  }
}

/** Runs the shared preconditions, returning an early outcome when they fail. */
function precheck(ctx: RuleContext, rule: RuleSpec): RuleOutcome | null {
  const missing = missingMetrics(ctx, rule)
  if (missing.length > 0) {
    return {
      kind: 'NOT_EVALUABLE',
      rule_id: rule.id,
      reason: `Required metrics are absent for this period: ${missing
        .map((m) => METRIC_LABELS[m])
        .join(', ')}.`,
      missing,
    }
  }
  return null
}

function finish(ctx: RuleContext, rule: RuleSpec, draft: DiagnosisDraft): RuleOutcome {
  const suppression = suppressingConfounder(ctx, rule)
  if (suppression) {
    return {
      kind: 'SUPPRESSED',
      rule_id: rule.id,
      rule_name: rule.name,
      confounder: suppression.id,
      detail: suppression.detail,
    }
  }
  return { kind: 'TRIGGERED', diagnosis: buildDiagnosis(ctx, draft) }
}

const notTriggered = (rule: RuleSpec, reason: string): RuleOutcome => ({
  kind: 'NOT_TRIGGERED',
  rule_id: rule.id,
  reason,
})

// ── DATA-002 · Low Sample Warning ─────────────────────────────────────────
// Trigger: Orders < 10 OR product_views < 100 for a conversion/product diagnosis

function evalData002(ctx: RuleContext): RuleOutcome {
  const rule = getRule('DATA-002')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const orders = ctx.current.totals.orders
  const views = ctx.current.totals.product_views
  const lowOrders = orders !== null && below(orders, 10)
  const lowViews = views !== null && below(views, 100)

  if (!lowOrders && !lowViews) {
    return notTriggered(rule, `Sample is sufficient: ${num(orders)} orders, ${num(views)} product views.`)
  }

  const reasons = [
    lowOrders ? `${num(orders)} orders (below 10)` : null,
    lowViews ? `${num(views)} product views (below 100)` : null,
  ].filter(Boolean)

  return finish(ctx, rule, {
    rule,
    observation: `The analysis period has ${reasons.join(' and ')}.`,
    diagnosis:
      'Conversion and product findings for this period rest on a sample too small to separate a real change from ordinary variation.',
    hypothesis:
      'Any conversion or product movement observed here may be noise. Widening the period or waiting for volume should stabilise the numbers.',
    dont_touch:
      'Do not change pricing, creative or budgets on the strength of conversion or product findings from this period alone.',
    monitor: {
      metrics: ['orders', 'product_views'],
      window_days: 14,
      note: 'Re-run the analysis once orders exceed 10 and product views exceed 100.',
    },
    evidence: [
      evidenceFrom('DATA-002', ctx.changes.get('orders'), 10),
      evidenceFrom('DATA-002', ctx.changes.get('product_views'), 100),
    ],
    corroborating: [],
    signalChangePct: null,
    sampleActual: orders,
    impactValue: null,
  })
}

// ── TRAFFIC-001 · Traffic Decline ─────────────────────────────────────────
// Trigger: traffic_change_pct <= -15% AND current_traffic >= 100

function evalTraffic001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('TRAFFIC-001')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const traffic = ctx.changes.get('traffic')
  const currentTraffic = traffic.current ?? 0

  if (below(currentTraffic, 100)) {
    return notTriggered(rule, `Current traffic ${num(currentTraffic)} is below the minimum of 100.`)
  }
  if (!traffic.comparable || traffic.change_pct === null) {
    return notTriggered(rule, 'Traffic change cannot be expressed against this baseline.')
  }
  if (!atMost(traffic.change_pct, -0.15)) {
    return notTriggered(rule, `Traffic change ${pct(traffic.change_pct)} is above the -15% threshold.`)
  }

  const gmv = ctx.changes.get('gmv')
  const views = ctx.changes.get('product_views')

  // Revenue per visitor in the baseline, applied to the visitors lost.
  const baselineGmvPerVisitor =
    ctx.baseline.totals.gmv !== null && (ctx.baseline.totals.traffic ?? 0) > 0
      ? ctx.baseline.totals.gmv / ctx.baseline.totals.traffic!
      : null
  const impact =
    baselineGmvPerVisitor !== null && traffic.change_abs !== null
      ? traffic.change_abs * baselineGmvPerVisitor
      : null

  return finish(ctx, rule, {
    rule,
    observation: `Traffic fell ${pct(Math.abs(traffic.change_pct))} to ${num(traffic.current)} visits, from ${num(traffic.baseline)} in the comparison period.`,
    diagnosis:
      'Fewer people are reaching the shop. Downstream conversion metrics are being measured on a smaller and possibly different audience.',
    hypothesis:
      'Reduced content output, weaker distribution on recent posts, or a paused campaign is the most common source of a decline of this size. This has not been verified.',
    dont_touch:
      'Do not change product pages or pricing yet. Conversion metrics measured on a shrinking audience are unstable, and changing them now removes the baseline you need.',
    monitor: {
      metrics: ['traffic', 'product_views', 'gmv'],
      window_days: 14,
      note: 'Track daily traffic against the comparison period to confirm whether the decline is continuing or has levelled off.',
    },
    evidence: [
      evidenceFrom('TRAFFIC-001', traffic, -0.15),
      evidenceFrom('TRAFFIC-001', views, null),
      evidenceFrom('TRAFFIC-001', gmv, null, {
        baseline_gmv_per_visitor: baselineGmvPerVisitor,
      }),
    ],
    corroborating: [
      { agrees: (views.change_pct ?? 0) < 0 },
      { agrees: (gmv.change_pct ?? 0) < 0 },
    ],
    signalChangePct: traffic.change_pct,
    sampleActual: currentTraffic,
    impactValue: impact,
  })
}

// ── TRAFFIC-002 · Traffic Growth Without GMV Response ─────────────────────
// Trigger: traffic_change_pct >= 20% AND gmv_change_pct <= 5% AND current_traffic >= 100

function evalTraffic002(ctx: RuleContext): RuleOutcome {
  const rule = getRule('TRAFFIC-002')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const traffic = ctx.changes.get('traffic')
  const gmv = ctx.changes.get('gmv')
  const currentTraffic = traffic.current ?? 0

  if (below(currentTraffic, 100)) {
    return notTriggered(rule, `Current traffic ${num(currentTraffic)} is below the minimum of 100.`)
  }
  if (!traffic.comparable || !gmv.comparable || traffic.change_pct === null || gmv.change_pct === null) {
    return notTriggered(rule, 'Traffic or GMV change cannot be expressed against this baseline.')
  }
  if (!atLeast(traffic.change_pct, 0.2)) {
    return notTriggered(rule, `Traffic growth ${pct(traffic.change_pct)} is below the +20% threshold.`)
  }
  if (!atMost(gmv.change_pct, 0.05)) {
    return notTriggered(rule, `GMV growth ${pct(gmv.change_pct)} is above the +5% ceiling.`)
  }

  const baselineGmvPerVisitor =
    ctx.baseline.totals.gmv !== null && (ctx.baseline.totals.traffic ?? 0) > 0
      ? ctx.baseline.totals.gmv / ctx.baseline.totals.traffic!
      : null

  // GMV the additional traffic would have produced at the prior rate, less
  // what actually arrived.
  const impact =
    baselineGmvPerVisitor !== null && traffic.change_abs !== null && gmv.change_abs !== null
      ? traffic.change_abs * baselineGmvPerVisitor - gmv.change_abs
      : null

  const cvr = ctx.changes.get('cvr')
  const views = ctx.changes.get('product_views')

  return finish(ctx, rule, {
    rule,
    observation: `Traffic rose ${pct(traffic.change_pct)} to ${num(traffic.current)} visits while GMV moved ${pct(gmv.change_pct)}.`,
    diagnosis:
      'The additional audience is not converting at the rate the previous audience did. Volume grew; revenue did not follow.',
    hypothesis:
      'The new traffic is likely arriving with lower purchase intent, or is landing on products that do not match the content that brought it. Not yet verified.',
    dont_touch:
      'Do not increase spend or widen targeting further while the additional traffic is not converting — that scales the mismatch.',
    monitor: {
      metrics: ['traffic', 'cvr', 'gmv'],
      window_days: 14,
      note: 'Watch whether conversion recovers as the new traffic source matures, or stays flat.',
    },
    evidence: [
      evidenceFrom('TRAFFIC-002', traffic, 0.2),
      evidenceFrom('TRAFFIC-002', gmv, 0.05),
      evidenceFrom('TRAFFIC-002', cvr, null),
      evidenceFrom('TRAFFIC-002', views, null, {
        baseline_gmv_per_visitor: baselineGmvPerVisitor,
      }),
    ],
    corroborating: [
      { agrees: (cvr.change_pct ?? 0) < 0 },
      { agrees: (views.change_pct ?? 0) >= 0 },
    ],
    signalChangePct: traffic.change_pct,
    sampleActual: currentTraffic,
    impactValue: impact,
  })
}

// ── ATC-001 · ATC Rate Decline ────────────────────────────────────────────
// Trigger: atc_rate_change_pct <= -15% AND product_views >= 100

function evalAtc001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('ATC-001')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const atcRate = ctx.changes.get('atc_rate')
  const views = ctx.current.totals.product_views ?? 0

  if (below(views, 100)) {
    return notTriggered(rule, `Product views ${num(views)} are below the minimum of 100.`)
  }
  if (!atcRate.comparable || atcRate.change_pct === null) {
    return notTriggered(rule, 'Add-to-cart rate change cannot be expressed against this baseline.')
  }
  if (!atMost(atcRate.change_pct, -0.15)) {
    return notTriggered(rule, `Add-to-cart rate change ${pct(atcRate.change_pct)} is above the -15% threshold.`)
  }

  // Carts lost at current view volume, converted to GMV at the baseline
  // cart-to-order rate and baseline AOV.
  const baselineCartToOrder =
    ctx.baseline.totals.orders !== null && (ctx.baseline.totals.add_to_cart ?? 0) > 0
      ? ctx.baseline.totals.orders / ctx.baseline.totals.add_to_cart!
      : null
  const baselineAov = ctx.baseline.derived.aov
  const cartsLost = atcRate.change_abs !== null ? atcRate.change_abs * views : null
  const impact =
    cartsLost !== null && baselineCartToOrder !== null && baselineAov !== null
      ? cartsLost * baselineCartToOrder * baselineAov
      : null

  const cvr = ctx.changes.get('cvr')

  return finish(ctx, rule, {
    rule,
    observation: `Add-to-cart rate fell from ${pct(atcRate.baseline)} to ${pct(atcRate.current)} across ${num(views)} product views.`,
    diagnosis:
      'Shoppers are reaching product pages but adding to cart less often than before. The loss sits at the product page, not at traffic acquisition.',
    hypothesis:
      'A change to price, main image, review state, delivery promise or variant availability on high-view products is the usual source. Not yet verified.',
    dont_touch:
      'Do not change traffic sources or budgets while the product page is the stage losing shoppers — more traffic through the same page repeats the loss.',
    monitor: {
      metrics: ['atc_rate', 'product_views', 'cvr'],
      window_days: 14,
      note: 'Track add-to-cart rate on the highest-view products specifically, not just the shop average.',
    },
    evidence: [
      evidenceFrom('ATC-001', atcRate, -0.15, {
        baseline_cart_to_order_rate: baselineCartToOrder,
        carts_lost_at_current_views: cartsLost,
      }),
      evidenceFrom('ATC-001', ctx.changes.get('add_to_cart'), null),
      evidenceFrom('ATC-001', ctx.changes.get('product_views'), 100),
      evidenceFrom('ATC-001', cvr, null),
    ],
    corroborating: [{ agrees: (cvr.change_pct ?? 0) < 0 }],
    signalChangePct: atcRate.change_pct,
    sampleActual: views,
    impactValue: impact,
  })
}

// ── CONV-001 · Conversion Bottleneck ──────────────────────────────────────
// Trigger: cvr_change_pct <= -15% AND orders >= 10 AND comparison_valid=true

function evalConv001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('CONV-001')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const cvr = ctx.changes.get('cvr')
  const orders = ctx.current.totals.orders ?? 0

  if (!ctx.baselineInfo.comparison_valid) {
    return notTriggered(rule, `Comparison is not valid: ${ctx.baselineInfo.invalid_reason}`)
  }
  if (below(orders, 10)) {
    return notTriggered(rule, `Orders ${num(orders)} are below the minimum of 10.`)
  }
  if (!cvr.comparable || cvr.change_pct === null) {
    return notTriggered(rule, 'Conversion rate change cannot be expressed against this baseline.')
  }
  if (!atMost(cvr.change_pct, -0.15)) {
    return notTriggered(rule, `Conversion rate change ${pct(cvr.change_pct)} is above the -15% threshold.`)
  }

  const views = ctx.current.totals.product_views ?? 0
  const currentAov = ctx.current.derived.aov
  const impact =
    cvr.change_abs !== null && currentAov !== null ? cvr.change_abs * views * currentAov : null

  const atcRate = ctx.changes.get('atc_rate')
  const checkoutRate = ctx.changes.get('checkout_rate')

  const stageLosses: string[] = []
  if ((atcRate.change_pct ?? 0) < -0.05) stageLosses.push('views → cart')
  if ((checkoutRate.change_pct ?? 0) < -0.05) stageLosses.push('cart → checkout')

  return finish(ctx, rule, {
    rule,
    observation: `Conversion rate fell from ${pct(cvr.baseline)} to ${pct(cvr.current)} on ${num(orders)} orders across ${num(views)} product views.`,
    diagnosis:
      stageLosses.length > 0
        ? `Fewer of the same visitors are buying. The largest losses sit at ${stageLosses.join(' and ')}.`
        : 'Fewer of the same visitors are buying. No single funnel stage carries the loss, which points to a change affecting the whole path to purchase.',
    hypothesis:
      'A pricing, shipping-cost, promotion-eligibility or stock change between the two periods is the most common cause of a shop-wide conversion drop. Not yet verified.',
    dont_touch:
      'Do not increase traffic spend to compensate. More visitors through a funnel that converts worse increases cost without recovering revenue.',
    monitor: {
      metrics: ['cvr', 'atc_rate', 'checkout_rate', 'orders'],
      window_days: 14,
      note: 'Compare each funnel stage daily against the comparison period to locate the exact date the loss began.',
    },
    evidence: [
      evidenceFrom('CONV-001', cvr, -0.15, {
        gmv_effect_at_current_views: impact,
        stage_losses: stageLosses,
      }),
      evidenceFrom('CONV-001', atcRate, null),
      evidenceFrom('CONV-001', checkoutRate, null),
      evidenceFrom('CONV-001', ctx.changes.get('orders'), 10),
      evidenceFrom('CONV-001', ctx.changes.get('product_views'), null),
    ],
    corroborating: [
      { agrees: (atcRate.change_pct ?? 0) < 0 },
      { agrees: (checkoutRate.change_pct ?? 0) < 0 },
    ],
    signalChangePct: cvr.change_pct,
    sampleActual: orders,
    impactValue: impact,
  })
}

// ── CONV-002 · High Traffic Low Conversion ────────────────────────────────
// Trigger: traffic_change_pct >= 15% AND cvr_change_pct <= -20% AND orders >= 10

function evalConv002(ctx: RuleContext): RuleOutcome {
  const rule = getRule('CONV-002')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const traffic = ctx.changes.get('traffic')
  const cvr = ctx.changes.get('cvr')
  const orders = ctx.current.totals.orders ?? 0

  if (below(orders, 10)) {
    return notTriggered(rule, `Orders ${num(orders)} are below the minimum of 10.`)
  }
  if (!traffic.comparable || !cvr.comparable || traffic.change_pct === null || cvr.change_pct === null) {
    return notTriggered(rule, 'Traffic or conversion change cannot be expressed against this baseline.')
  }
  if (!atLeast(traffic.change_pct, 0.15)) {
    return notTriggered(rule, `Traffic growth ${pct(traffic.change_pct)} is below the +15% threshold.`)
  }
  if (!atMost(cvr.change_pct, -0.2)) {
    return notTriggered(rule, `Conversion rate change ${pct(cvr.change_pct)} is above the -20% threshold.`)
  }

  const views = ctx.current.totals.product_views ?? 0
  const currentAov = ctx.current.derived.aov
  const impact =
    cvr.change_abs !== null && currentAov !== null ? cvr.change_abs * views * currentAov : null

  return finish(ctx, rule, {
    rule,
    observation: `Traffic rose ${pct(traffic.change_pct)} while conversion rate fell ${pct(Math.abs(cvr.change_pct))}, from ${pct(cvr.baseline)} to ${pct(cvr.current)}.`,
    diagnosis:
      'The shop is attracting materially more visitors who buy materially less. This is a traffic-quality change rather than a product-page failure.',
    hypothesis:
      'A new source, audience or creative is bringing visitors with different intent. The product pages have not necessarily changed. Not yet verified.',
    dont_touch:
      'Do not rewrite product pages first. The pages were converting the previous audience; the audience is what changed.',
    monitor: {
      metrics: ['traffic', 'cvr', 'orders'],
      window_days: 14,
      note: 'Segment conversion by traffic source to confirm the new source is the lower-converting one.',
    },
    evidence: [
      evidenceFrom('CONV-002', traffic, 0.15),
      evidenceFrom('CONV-002', cvr, -0.2, { gmv_effect_at_current_views: impact }),
      evidenceFrom('CONV-002', ctx.changes.get('orders'), 10),
    ],
    corroborating: [
      { agrees: (ctx.changes.get('product_views').change_pct ?? 0) > 0 },
      { agrees: (ctx.changes.get('atc_rate').change_pct ?? 0) < 0 },
    ],
    signalChangePct: cvr.change_pct,
    sampleActual: orders,
    impactValue: impact,
  })
}

// ── AOV-001 · AOV Decline ─────────────────────────────────────────────────
// Trigger: aov_change_pct <= -15% AND orders >= 10

function evalAov001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('AOV-001')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const aov = ctx.changes.get('aov')
  const orders = ctx.current.totals.orders ?? 0

  if (below(orders, 10)) {
    return notTriggered(rule, `Orders ${num(orders)} are below the minimum of 10.`)
  }
  if (!aov.comparable || aov.change_pct === null) {
    return notTriggered(rule, 'AOV change cannot be expressed against this baseline.')
  }
  if (!atMost(aov.change_pct, -0.15)) {
    return notTriggered(rule, `AOV change ${pct(aov.change_pct)} is above the -15% threshold.`)
  }

  const impact = aov.change_abs !== null ? aov.change_abs * orders : null

  return finish(ctx, rule, {
    rule,
    observation: `Average order value fell from ${money(aov.baseline, ctx.currency)} to ${money(aov.current, ctx.currency)} across ${num(orders)} orders.`,
    diagnosis:
      'Each order is worth less than it was. Order volume is not the issue; the value per order is.',
    hypothesis:
      'A shift in which products sell, or a discount or bundle change, is the usual source. Not yet verified.',
    dont_touch:
      'Do not raise prices to recover average order value before confirming the cause is discounting rather than product mix. Raising prices on a mix shift suppresses volume too.',
    monitor: {
      metrics: ['aov', 'orders', 'gmv'],
      window_days: 14,
      note: 'Track average order value alongside the product mix; a mix shift and a discount problem need opposite responses.',
    },
    evidence: [
      evidenceFrom('AOV-001', aov, -0.15, { gmv_effect_at_current_orders: impact }),
      evidenceFrom('AOV-001', ctx.changes.get('orders'), 10),
      evidenceFrom('AOV-001', ctx.changes.get('gmv'), null),
    ],
    corroborating: [{ agrees: (ctx.changes.get('gmv').change_pct ?? 0) < 0 }],
    signalChangePct: aov.change_pct,
    sampleActual: orders,
    impactValue: impact,
  })
}

// ── ADS-001 · Efficiency Decline ──────────────────────────────────────────
// Trigger: ad_roi_change_pct <= -20% AND spend_change_pct >= 10% AND spend_current >= 100

function evalAds001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('ADS-001')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const roi = ctx.changes.get('ad_roi')
  const spend = ctx.changes.get('spend')
  const spendCurrent = spend.current ?? 0

  if (below(spendCurrent, 100)) {
    return notTriggered(rule, `Current spend ${money(spendCurrent, ctx.currency)} is below the minimum of 100.`)
  }
  if (!roi.comparable || !spend.comparable || roi.change_pct === null || spend.change_pct === null) {
    return notTriggered(rule, 'Paid ROAS or spend change cannot be expressed against this baseline.')
  }
  if (!atMost(roi.change_pct, -0.2)) {
    return notTriggered(rule, `Paid ROAS change ${pct(roi.change_pct)} is above the -20% threshold.`)
  }
  if (!atLeast(spend.change_pct, 0.1)) {
    return notTriggered(rule, `Spend change ${pct(spend.change_pct)} is below the +10% threshold.`)
  }

  // Paid revenue forgone: current spend at the prior return rate, less actual.
  const impact =
    roi.baseline !== null && roi.current !== null ? spendCurrent * (roi.baseline - roi.current) : null

  return finish(ctx, rule, {
    rule,
    observation: `Spend rose ${pct(spend.change_pct)} to ${money(spend.current, ctx.currency)} while paid ROAS fell from ${num(roi.baseline, 2)} to ${num(roi.current, 2)}.`,
    diagnosis:
      'Paid advertising is returning less revenue per unit of spend than before, and spend has increased into that weaker return.',
    hypothesis:
      'Creative fatigue, audience saturation, or expansion into lower-intent placements typically produce this pattern. Not yet verified.',
    dont_touch:
      'Do not increase budgets further. Do not change bids, creative and targeting in the same week — simultaneous changes cannot be attributed afterwards.',
    monitor: {
      metrics: ['ad_roi', 'spend', 'paid_gmv'],
      window_days: 14,
      note: 'Track paid ROAS at campaign level. Shop-level ROAS hides which campaign carries the loss.',
    },
    evidence: [
      evidenceFrom('ADS-001', roi, -0.2, { paid_revenue_forgone: impact }),
      evidenceFrom('ADS-001', spend, 0.1),
      evidenceFrom('ADS-001', ctx.changes.get('paid_gmv'), null),
    ],
    corroborating: [{ agrees: (ctx.changes.get('paid_gmv').change_pct ?? 1) < (spend.change_pct ?? 0) }],
    signalChangePct: roi.change_pct,
    sampleActual: spendCurrent,
    impactValue: impact,
    extraLimitations: [
      'Paid ROAS here is paid-attributed GMV divided by ad spend. It is not comparable with GMV Max ROI, which uses a different attribution model.',
    ],
  })
}

// ── ADS-002 · Spend Growth Without Revenue Response ───────────────────────
// Trigger: spend_change_pct >= 20% AND paid_gmv_change_pct <= 5% AND spend_current >= 100

function evalAds002(ctx: RuleContext): RuleOutcome {
  const rule = getRule('ADS-002')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const spend = ctx.changes.get('spend')
  const paidGmv = ctx.changes.get('paid_gmv')
  const spendCurrent = spend.current ?? 0

  if (below(spendCurrent, 100)) {
    return notTriggered(rule, `Current spend ${money(spendCurrent, ctx.currency)} is below the minimum of 100.`)
  }
  if (!spend.comparable || !paidGmv.comparable || spend.change_pct === null || paidGmv.change_pct === null) {
    return notTriggered(rule, 'Spend or paid GMV change cannot be expressed against this baseline.')
  }
  if (!atLeast(spend.change_pct, 0.2)) {
    return notTriggered(rule, `Spend growth ${pct(spend.change_pct)} is below the +20% threshold.`)
  }
  if (!atMost(paidGmv.change_pct, 0.05)) {
    return notTriggered(rule, `Paid GMV growth ${pct(paidGmv.change_pct)} is above the +5% ceiling.`)
  }

  const baselineRoi = ctx.baseline.derived.ad_roi
  const impact =
    baselineRoi !== null && spend.change_abs !== null && paidGmv.change_abs !== null
      ? spend.change_abs * baselineRoi - paidGmv.change_abs
      : null

  return finish(ctx, rule, {
    rule,
    observation: `Spend rose ${pct(spend.change_pct)} to ${money(spend.current, ctx.currency)} while paid GMV moved ${pct(paidGmv.change_pct)}.`,
    diagnosis:
      'The additional advertising budget has not produced additional attributed revenue.',
    hypothesis:
      'The incremental budget is likely reaching an audience already being converted, or an audience that does not convert. Not yet verified.',
    dont_touch:
      'Do not raise budgets again this period. Do not conclude the channel is failing outright — the base spend may still be productive; it is the increment that is not.',
    monitor: {
      metrics: ['spend', 'paid_gmv', 'ad_roi'],
      window_days: 14,
      note: 'Compare incremental spend against incremental attributed revenue per campaign, not shop totals.',
    },
    evidence: [
      evidenceFrom('ADS-002', spend, 0.2, { revenue_shortfall_vs_prior_rate: impact }),
      evidenceFrom('ADS-002', paidGmv, 0.05),
      evidenceFrom('ADS-002', ctx.changes.get('ad_roi'), null),
    ],
    corroborating: [{ agrees: (ctx.changes.get('ad_roi').change_pct ?? 0) < 0 }],
    signalChangePct: spend.change_pct,
    sampleActual: spendCurrent,
    impactValue: impact,
    extraLimitations: [
      'Paid GMV reflects the source report’s paid attribution window. It is not comparable with GMV Max attributed revenue.',
    ],
  })
}

// ── GMVMAX-001 · GMV Max ROI Decline With Gross Revenue Growth ────────────
// Trigger: gmvmax_roi_change_pct <= -20% AND gross_revenue_change_pct >= 10%

function evalGmvmax001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('GMVMAX-001')
  const pre = precheck(ctx, rule)
  if (pre) return pre

  const roi = ctx.changes.get('gmvmax_roi')
  const grossRevenue = ctx.changes.get('gross_revenue')

  if (!roi.comparable || !grossRevenue.comparable || roi.change_pct === null || grossRevenue.change_pct === null) {
    return notTriggered(rule, 'GMV Max ROI or gross revenue change cannot be expressed against this baseline.')
  }
  if (!atMost(roi.change_pct, -0.2)) {
    return notTriggered(rule, `GMV Max ROI change ${pct(roi.change_pct)} is above the -20% threshold.`)
  }
  if (!atLeast(grossRevenue.change_pct, 0.1)) {
    return notTriggered(rule, `Gross revenue growth ${pct(grossRevenue.change_pct)} is below the +10% threshold.`)
  }

  const costCurrent = ctx.current.totals.gmvmax_cost ?? 0
  const impact =
    roi.baseline !== null && roi.current !== null ? costCurrent * (roi.baseline - roi.current) : null

  return finish(ctx, rule, {
    rule,
    observation: `Product GMV Max gross revenue rose ${pct(grossRevenue.change_pct)} to ${money(grossRevenue.current, ctx.currency)}, while GMV Max ROI fell from ${num(roi.baseline, 2)} to ${num(roi.current, 2)}.`,
    diagnosis:
      'Product GMV Max is producing more attributed revenue at a lower return per unit of cost. This is a scale-versus-efficiency trade-off, not necessarily a failure.',
    hypothesis:
      'Campaign expansion into broader inventory typically raises attributed revenue while lowering the ratio. Whether that trade is acceptable is a commercial decision, not a diagnostic one.',
    dont_touch:
      'Do not compare this ROI against paid-ads ROAS and do not cut GMV Max cost on that comparison. GMV Max attribution includes organic and affiliate orders while the campaign is active, so the two ratios measure different things.',
    monitor: {
      metrics: ['gmvmax_roi', 'gross_revenue', 'gmvmax_cost_per_order'],
      window_days: 14,
      note: 'Track GMV Max cost per order alongside ROI. Stable cost per order with falling ROI indicates a mix effect rather than an efficiency loss.',
    },
    evidence: [
      evidenceFrom('GMVMAX-001', roi, -0.2, { return_forgone_at_current_cost: impact }),
      evidenceFrom('GMVMAX-001', grossRevenue, 0.1),
      evidenceFrom('GMVMAX-001', ctx.changes.get('gmvmax_cost'), null),
      evidenceFrom('GMVMAX-001', ctx.changes.get('gmvmax_cost_per_order'), null),
    ],
    corroborating: [
      { agrees: (ctx.changes.get('gmvmax_cost').change_pct ?? 0) > 0 },
      { agrees: (ctx.changes.get('gmvmax_cost_per_order').change_pct ?? 0) > 0 },
    ],
    signalChangePct: roi.change_pct,
    sampleActual: null,
    impactValue: impact,
    extraLimitations: [
      'Product GMV Max ROI is TikTok-defined Gross Revenue divided by GMV Max cost. It attributes orders for promoted products including organic and affiliate orders while the campaign is active, and is not equivalent to VSA/PSA ROAS.',
    ],
  })
}

// ── ANOM-001 · GMV Anomaly ────────────────────────────────────────────────
// Trigger: abs(gmv_z_score) >= 3 AND historical_observations >= 14

function evalAnom001(ctx: RuleContext): RuleOutcome {
  const rule = getRule('ANOM-001')

  const historyValues = ctx.history
    .filter((row) => row.gmv !== null)
    .sort((a, b) => a.business_date.localeCompare(b.business_date))
    .map((row) => row.gmv!)

  const periodValues = ctx.current.daily
    .filter((row) => row.gmv !== null)
    .map((row) => row.gmv!)

  if (periodValues.length === 0) {
    return {
      kind: 'NOT_EVALUABLE',
      rule_id: rule.id,
      reason: 'No daily GMV observations exist inside the analysis period.',
      missing: ['gmv'],
    }
  }

  // The latest in-period day is scored against everything before it.
  const series = [...historyValues, periodValues[periodValues.length - 1]!]
  const { z, mean, stdev, observations } = zScoreOfLatest(series)

  if (observations < 14) {
    return notTriggered(rule, `Only ${observations} historical observations; 14 are required.`)
  }
  if (z === null) {
    return notTriggered(rule, 'Historical GMV has no dispersion; a z-score cannot be computed.')
  }
  if (!atLeast(Math.abs(z), 3)) {
    return notTriggered(rule, `GMV z-score ${z.toFixed(2)} is inside the ±3 threshold.`)
  }

  const latest = series[series.length - 1]!
  const impact = latest - mean
  const direction = z > 0 ? 'above' : 'below'

  return finish(ctx, rule, {
    rule,
    observation: `Daily GMV of ${money(latest, ctx.currency)} sits ${Math.abs(z).toFixed(1)} standard deviations ${direction} the ${observations}-day mean of ${money(mean, ctx.currency)}.`,
    diagnosis:
      'One day in this period is a statistical outlier against recent history. It is distorting period totals and any average computed from them.',
    hypothesis:
      'Outliers of this size usually reflect a campaign event, a platform promotion, a stockout, or an incomplete export for that date rather than an underlying trend change.',
    dont_touch:
      'Do not set budgets, targets or baselines from a period containing this day until the outlier is explained. Do not delete the day from the data — record what happened instead.',
    monitor: {
      metrics: ['gmv'],
      window_days: 7,
      note: 'Confirm whether the following days return to the prior range.',
    },
    evidence: [
      {
        rule_id: 'ANOM-001',
        metric_name: 'gmv',
        current_value: latest,
        baseline_value: mean,
        change_pct: mean === 0 ? null : (latest - mean) / Math.abs(mean),
        threshold: 3,
        attribution: 'SHOP_TOTAL',
        evidence_json: {
          z_score: z,
          mean,
          stdev,
          historical_observations: observations,
        },
      },
    ],
    corroborating: [],
    signalChangePct: mean === 0 ? null : (latest - mean) / Math.abs(mean),
    sampleActual: observations,
    impactValue: impact,
  })
}

// ── PROD-001 / PROD-002 · product-grain rules ─────────────────────────────

function productChangePct(
  current: number | null,
  baseline: number | null,
): number | null {
  if (current === null || baseline === null || baseline === 0) return null
  return (current - baseline) / Math.abs(baseline)
}

function evalProductRules(ctx: RuleContext): RuleOutcome[] {
  const prod001 = getRule('PROD-001')
  const prod002 = getRule('PROD-002')
  const outcomes: RuleOutcome[] = []

  if (ctx.productsCurrent.length === 0) {
    const reason = 'No product-grain rows exist for this period.'
    return [
      { kind: 'NOT_EVALUABLE', rule_id: prod001.id, reason, missing: ['product_views'] },
      { kind: 'NOT_EVALUABLE', rule_id: prod002.id, reason, missing: ['product_views'] },
    ]
  }

  const baselineByKey = new Map(ctx.productsBaseline.map((p) => [p.product_key, p]))

  for (const product of ctx.productsCurrent) {
    const baseline = baselineByKey.get(product.product_key)
    if (!baseline) continue

    const views = product.product_views ?? 0
    const cvrChange = productChangePct(product.cvr, baseline.cvr)
    const viewsChange = productChangePct(product.product_views, baseline.product_views)

    // PROD-001: product_views >= 100 AND product_cvr_change_pct <= -20%
    if (atLeast(views, 100) && cvrChange !== null && atMost(cvrChange, -0.2)) {
      const impact =
        product.cvr !== null && baseline.cvr !== null && product.aov !== null
          ? (product.cvr - baseline.cvr) * views * product.aov
          : null

      const outcome = finishProduct(ctx, prod001, product.product_key, {
        rule: prod001,
        observation: `${product.product_key} converted at ${pct(product.cvr)} on ${num(views)} views, down from ${pct(baseline.cvr)}.`,
        diagnosis:
          'This product still draws views but converts materially worse than it did. Demand is intact; something on the offer or page is losing the shopper.',
        hypothesis:
          'Price change, image change, review deterioration, or a variant going out of stock are the usual causes at this grain. Not yet verified.',
        dont_touch:
          'Do not delist or de-prioritise this product on this signal alone. It is still attracting demand, which is the harder half to rebuild.',
        monitor: {
          metrics: ['cvr', 'product_views', 'orders'],
          window_days: 14,
          note: `Track ${product.product_key} conversion daily against its own prior rate.`,
        },
        evidence: [
          {
            rule_id: 'PROD-001',
            metric_name: 'cvr',
            current_value: product.cvr,
            baseline_value: baseline.cvr,
            change_pct: cvrChange,
            threshold: -0.2,
            attribution: 'SHOP_TOTAL',
            evidence_json: { product_key: product.product_key, gmv_effect: impact },
          },
          {
            rule_id: 'PROD-001',
            metric_name: 'product_views',
            current_value: product.product_views,
            baseline_value: baseline.product_views,
            change_pct: viewsChange,
            threshold: 100,
            attribution: 'SHOP_TOTAL',
            evidence_json: { product_key: product.product_key },
          },
        ],
        corroborating: [{ agrees: (productChangePct(product.atc_rate, baseline.atc_rate) ?? 0) < 0 }],
        signalChangePct: cvrChange,
        sampleActual: views,
        impactValue: impact,
      })
      outcomes.push(outcome)
      continue
    }

    // PROD-002: product_cvr_change_pct >= 15% AND product_views_change_pct <= -20% AND product_views >= 100
    if (
      atLeast(views, 100) &&
      cvrChange !== null &&
      viewsChange !== null &&
      atLeast(cvrChange, 0.15) &&
      atMost(viewsChange, -0.2)
    ) {
      // Revenue recoverable by restoring prior view volume at the new,
      // better conversion rate.
      const viewsLost = (baseline.product_views ?? 0) - views
      const impact =
        product.cvr !== null && product.aov !== null ? viewsLost * product.cvr * product.aov : null

      const outcome = finishProduct(ctx, prod002, product.product_key, {
        rule: prod002,
        observation: `${product.product_key} converted at ${pct(product.cvr)}, up from ${pct(baseline.cvr)}, while views fell ${pct(Math.abs(viewsChange))} to ${num(views)}.`,
        diagnosis:
          'This product converts better than before but is being shown to fewer people. The constraint is exposure, not the offer.',
        hypothesis:
          'Reduced content featuring this product, or a shift in which products campaigns promote, is the usual cause. Not yet verified.',
        dont_touch:
          'Do not change price, images or copy on this product. It is converting better than it was; changing the page risks the improvement.',
        monitor: {
          metrics: ['product_views', 'cvr', 'gmv'],
          window_days: 14,
          note: `Track whether restored exposure for ${product.product_key} holds the improved conversion rate.`,
        },
        evidence: [
          {
            rule_id: 'PROD-002',
            metric_name: 'cvr',
            current_value: product.cvr,
            baseline_value: baseline.cvr,
            change_pct: cvrChange,
            threshold: 0.15,
            attribution: 'SHOP_TOTAL',
            evidence_json: { product_key: product.product_key },
          },
          {
            rule_id: 'PROD-002',
            metric_name: 'product_views',
            current_value: product.product_views,
            baseline_value: baseline.product_views,
            change_pct: viewsChange,
            threshold: -0.2,
            attribution: 'SHOP_TOTAL',
            evidence_json: {
              product_key: product.product_key,
              views_lost: viewsLost,
              recoverable_gmv: impact,
            },
          },
        ],
        corroborating: [{ agrees: (productChangePct(product.orders, baseline.orders) ?? 0) < 0 }],
        signalChangePct: cvrChange,
        sampleActual: views,
        impactValue: impact,
      })
      outcomes.push(outcome)
    }
  }

  if (outcomes.length === 0) {
    outcomes.push(
      notTriggered(prod001, 'No product met the view threshold with a qualifying conversion decline.'),
      notTriggered(prod002, 'No product showed rising conversion against falling views.'),
    )
  }
  return outcomes
}

/** Product diagnoses carry the product key in the rule name for traceability. */
function finishProduct(
  ctx: RuleContext,
  rule: RuleSpec,
  productKey: string,
  draft: DiagnosisDraft,
): RuleOutcome {
  const outcome = finish(ctx, rule, draft)
  if (outcome.kind === 'TRIGGERED') {
    outcome.diagnosis.rule_name = `${rule.name} — ${productKey}`
  }
  return outcome
}

// ── registry ──────────────────────────────────────────────────────────────

type ShopEvaluator = (ctx: RuleContext) => RuleOutcome

const SHOP_EVALUATORS: Record<string, ShopEvaluator> = {
  'DATA-002': evalData002,
  'TRAFFIC-001': evalTraffic001,
  'TRAFFIC-002': evalTraffic002,
  'ATC-001': evalAtc001,
  'CONV-001': evalConv001,
  'CONV-002': evalConv002,
  'AOV-001': evalAov001,
  'ADS-001': evalAds001,
  'ADS-002': evalAds002,
  'GMVMAX-001': evalGmvmax001,
  'ANOM-001': evalAnom001,
}

/**
 * Evaluates every implemented rule. DATA-001 is handled by the engine before
 * this runs, because a missing required funnel metric terminates the analysis
 * rather than producing a diagnosis alongside others.
 */
export function evaluateRules(ctx: RuleContext): RuleOutcome[] {
  const outcomes: RuleOutcome[] = []

  for (const rule of IMPLEMENTED_RULES) {
    if (rule.id === 'DATA-001') continue
    if (rule.grain === 'PRODUCT') continue
    const evaluator = SHOP_EVALUATORS[rule.id]
    if (!evaluator) {
      throw new Error(
        `Rule ${rule.id} is marked IMPLEMENTED but has no evaluator. Rule catalog and engine are out of sync.`,
      )
    }
    outcomes.push(evaluator(ctx))
  }

  outcomes.push(...evalProductRules(ctx))
  return outcomes
}
