/**
 * P0 rule catalog.
 *
 * Triggers, severities and suppression lists are transcribed verbatim from
 * `03_INTELLIGENCE/P0_RULE_CATALOG_V1.json` (rule_set_version 1.4.0). No
 * threshold in this file may be changed without a catalog change, an ADR and a
 * golden-vector regression run.
 *
 * CONTRACT CONFLICT — recorded, not resolved by guessing:
 * `03_INTELLIGENCE/P0_RULE_COVERAGE_V1.6.json` declares 24 rules in MVP P0
 * scope, but `P0_RULE_CATALOG_V1.json` specifies triggers for only 14. The
 * remaining 10 are registered here with status `SPEC_INCOMPLETE` so that they
 * are visible to the release gate and reported in every analysis, rather than
 * being silently dropped or given invented thresholds.
 * See `CONTRACT_LOCK_REPORT.md` (CONFLICT-001).
 */

import type { ConfounderId, Severity } from './types'
import type { CanonicalMetric } from '../metrics/registry'

export type RuleFamily =
  | 'DATA'
  | 'TRAFFIC'
  | 'ATC'
  | 'CONV'
  | 'AOV'
  | 'ADS'
  | 'GMVMAX'
  | 'PROD'
  | 'LIVE'
  | 'AFF'
  | 'CONTENT'
  | 'ANOM'

export type RuleImplementationStatus = 'IMPLEMENTED' | 'SPEC_INCOMPLETE'

/** Grain a rule evaluates at. */
export type RuleGrain = 'SHOP' | 'PRODUCT'

export interface RuleSpec {
  id: string
  name: string
  family: RuleFamily
  grain: RuleGrain
  severity: Severity
  /** Verbatim trigger expression from the catalog. Source of truth for tests. */
  trigger_text: string
  suppression: ConfounderId[]
  /**
   * Metrics that must be present and non-null for the rule to be evaluable.
   * A missing required metric yields INSUFFICIENT_EVIDENCE, never a false
   * negative (03_INTELLIGENCE/DECISION_CONTRACT.md).
   */
  required_metrics: CanonicalMetric[]
  /** Minimum sample gate encoded in the trigger, for confidence scoring. */
  minimum_sample: { metric: CanonicalMetric; value: number } | null
  /**
   * Primary threshold the signal is compared against, as a proportion
   * (-0.15 = -15%). Used for signal-strength scoring and evidence payloads.
   */
  primary_threshold: number | null
  status: RuleImplementationStatus
  /** Why the rule cannot be implemented. Present iff status is SPEC_INCOMPLETE. */
  spec_gap?: string
}

export const RULE_CATALOG: readonly RuleSpec[] = [
  // ── DATA ────────────────────────────────────────────────────────────────
  {
    id: 'DATA-001',
    name: 'Insufficient Funnel Data',
    family: 'DATA',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text: 'Required funnel metric missing for the requested analysis',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'IMPLEMENTED',
  },
  {
    id: 'DATA-002',
    name: 'Low Sample Warning',
    family: 'DATA',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text:
      'Orders < 10 OR product_views < 100 for a conversion/product diagnosis',
    suppression: [],
    required_metrics: ['orders', 'product_views'],
    minimum_sample: null,
    primary_threshold: null,
    status: 'IMPLEMENTED',
  },

  // ── TRAFFIC ─────────────────────────────────────────────────────────────
  {
    id: 'TRAFFIC-001',
    name: 'Traffic Decline',
    family: 'TRAFFIC',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text: 'traffic_change_pct <= -15% AND current_traffic >= 100',
    suppression: [],
    required_metrics: ['traffic'],
    minimum_sample: { metric: 'traffic', value: 100 },
    primary_threshold: -0.15,
    status: 'IMPLEMENTED',
  },
  {
    id: 'TRAFFIC-002',
    name: 'Traffic Growth Without GMV Response',
    family: 'TRAFFIC',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text:
      'traffic_change_pct >= 20% AND gmv_change_pct <= 5% AND current_traffic >= 100',
    suppression: ['DATA-INVALID'],
    required_metrics: ['traffic', 'gmv'],
    minimum_sample: { metric: 'traffic', value: 100 },
    primary_threshold: 0.2,
    status: 'IMPLEMENTED',
  },

  // ── ATC ─────────────────────────────────────────────────────────────────
  {
    id: 'ATC-001',
    name: 'ATC Rate Decline',
    family: 'ATC',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text: 'atc_rate_change_pct <= -15% AND product_views >= 100',
    suppression: ['STOCKOUT_CONFOUNDER'],
    required_metrics: ['add_to_cart', 'product_views'],
    minimum_sample: { metric: 'product_views', value: 100 },
    primary_threshold: -0.15,
    status: 'IMPLEMENTED',
  },

  // ── CONV ────────────────────────────────────────────────────────────────
  {
    id: 'CONV-001',
    name: 'Conversion Bottleneck',
    family: 'CONV',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text:
      'cvr_change_pct <= -15% AND orders >= 10 AND comparison_valid=true',
    suppression: ['STOCKOUT_CONFOUNDER', 'DATA-INVALID'],
    required_metrics: ['orders', 'product_views'],
    minimum_sample: { metric: 'orders', value: 10 },
    primary_threshold: -0.15,
    status: 'IMPLEMENTED',
  },
  {
    id: 'CONV-002',
    name: 'High Traffic Low Conversion',
    family: 'CONV',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text:
      'traffic_change_pct >= 15% AND cvr_change_pct <= -20% AND orders >= 10',
    suppression: ['DATA-INVALID'],
    required_metrics: ['traffic', 'orders', 'product_views'],
    minimum_sample: { metric: 'orders', value: 10 },
    primary_threshold: -0.2,
    status: 'IMPLEMENTED',
  },

  // ── AOV ─────────────────────────────────────────────────────────────────
  {
    id: 'AOV-001',
    name: 'AOV Decline',
    family: 'AOV',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: 'aov_change_pct <= -15% AND orders >= 10',
    suppression: ['DATA-INVALID'],
    required_metrics: ['gmv', 'orders'],
    minimum_sample: { metric: 'orders', value: 10 },
    primary_threshold: -0.15,
    status: 'IMPLEMENTED',
  },

  // ── ADS ─────────────────────────────────────────────────────────────────
  {
    id: 'ADS-001',
    name: 'Efficiency Decline',
    family: 'ADS',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text:
      'ad_roi_change_pct <= -20% AND spend_change_pct >= 10% AND spend_current >= 100',
    suppression: ['ATTRIBUTION-INCOMPATIBLE'],
    required_metrics: ['spend', 'paid_gmv'],
    minimum_sample: { metric: 'spend', value: 100 },
    primary_threshold: -0.2,
    status: 'IMPLEMENTED',
  },
  {
    id: 'ADS-002',
    name: 'Spend Growth Without Revenue Response',
    family: 'ADS',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text:
      'spend_change_pct >= 20% AND paid_gmv_change_pct <= 5% AND spend_current >= 100',
    suppression: ['ATTRIBUTION-INCOMPATIBLE'],
    required_metrics: ['spend', 'paid_gmv'],
    minimum_sample: { metric: 'spend', value: 100 },
    primary_threshold: 0.2,
    status: 'IMPLEMENTED',
  },

  // ── GMV MAX ─────────────────────────────────────────────────────────────
  {
    id: 'GMVMAX-001',
    name: 'GMV Max ROI Decline With Gross Revenue Growth',
    family: 'GMVMAX',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text:
      'gmvmax_roi_change_pct <= -20% AND gross_revenue_change_pct >= 10%',
    suppression: ['ATTRIBUTION-INCOMPATIBLE'],
    required_metrics: ['gross_revenue', 'gmvmax_cost'],
    minimum_sample: null,
    primary_threshold: -0.2,
    status: 'IMPLEMENTED',
  },
  {
    id: 'GMVMAX-002',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'GMVMAX',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'Listed in P0_RULE_COVERAGE_V1.6.json but absent from P0_RULE_CATALOG_V1.json — no trigger, severity or evidence payload defined.',
  },
  {
    id: 'GMVMAX-003',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'GMVMAX',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'Listed in P0_RULE_COVERAGE_V1.6.json but absent from P0_RULE_CATALOG_V1.json — no trigger, severity or evidence payload defined.',
  },

  // ── PRODUCT ─────────────────────────────────────────────────────────────
  {
    id: 'PROD-001',
    name: 'High Traffic Low CVR Product',
    family: 'PROD',
    grain: 'PRODUCT',
    severity: 'HIGH',
    trigger_text: 'product_views >= 100 AND product_cvr_change_pct <= -20%',
    suppression: ['STOCKOUT_CONFOUNDER'],
    required_metrics: ['product_views', 'orders'],
    minimum_sample: { metric: 'product_views', value: 100 },
    primary_threshold: -0.2,
    status: 'IMPLEMENTED',
  },
  {
    id: 'PROD-002',
    name: 'High CVR Low Traffic Opportunity',
    family: 'PROD',
    grain: 'PRODUCT',
    severity: 'MEDIUM',
    trigger_text:
      'product_cvr_change_pct >= 15% AND product_views_change_pct <= -20% AND product_views >= 100',
    suppression: ['DATA-INVALID'],
    required_metrics: ['product_views', 'orders'],
    minimum_sample: { metric: 'product_views', value: 100 },
    primary_threshold: 0.15,
    status: 'IMPLEMENTED',
  },
  {
    id: 'PROD-003',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'PROD',
    grain: 'PRODUCT',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'Listed in P0_RULE_COVERAGE_V1.6.json but absent from P0_RULE_CATALOG_V1.json — no trigger, severity or evidence payload defined.',
  },

  // ── LIVE ────────────────────────────────────────────────────────────────
  {
    id: 'LIVE-001',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'LIVE',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'No trigger in P0_RULE_CATALOG_V1.json, and the contracted schema carries only aggregate `live_gmv` — no LIVE session grain exists to evaluate against.',
  },
  {
    id: 'LIVE-002',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'LIVE',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'No trigger in P0_RULE_CATALOG_V1.json, and the contracted schema carries only aggregate `live_gmv` — no LIVE session grain exists to evaluate against.',
  },

  // ── AFFILIATE ───────────────────────────────────────────────────────────
  {
    id: 'AFF-001',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'AFF',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'No trigger in P0_RULE_CATALOG_V1.json, and the contracted schema carries only aggregate `affiliate_gmv` — no creator/affiliate grain exists to evaluate against.',
  },
  {
    id: 'AFF-002',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'AFF',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'No trigger in P0_RULE_CATALOG_V1.json, and the contracted schema carries only aggregate `affiliate_gmv` — no creator/affiliate grain exists to evaluate against.',
  },

  // ── CONTENT ─────────────────────────────────────────────────────────────
  {
    id: 'CONTENT-001',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'CONTENT',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'No trigger in P0_RULE_CATALOG_V1.json, and no content-grain table exists in the contracted schema (0001_initial_schema.sql).',
  },
  {
    id: 'CONTENT-002',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'CONTENT',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'No trigger in P0_RULE_CATALOG_V1.json, and no content-grain table exists in the contracted schema (0001_initial_schema.sql).',
  },

  // ── ANOMALY ─────────────────────────────────────────────────────────────
  {
    id: 'ANOM-001',
    name: 'GMV Anomaly',
    family: 'ANOM',
    grain: 'SHOP',
    severity: 'HIGH',
    trigger_text: 'abs(gmv_z_score) >= 3 AND historical_observations >= 14',
    suppression: ['DATA-INVALID'],
    required_metrics: ['gmv'],
    minimum_sample: null,
    primary_threshold: 3,
    status: 'IMPLEMENTED',
  },
  {
    id: 'ANOM-002',
    name: 'Declared in P0 coverage; trigger not specified',
    family: 'ANOM',
    grain: 'SHOP',
    severity: 'MEDIUM',
    trigger_text: '',
    suppression: [],
    required_metrics: [],
    minimum_sample: null,
    primary_threshold: null,
    status: 'SPEC_INCOMPLETE',
    spec_gap:
      'Listed in P0_RULE_COVERAGE_V1.6.json but absent from P0_RULE_CATALOG_V1.json — no trigger, severity or evidence payload defined.',
  },
] as const

const BY_ID = new Map(RULE_CATALOG.map((r) => [r.id, r]))

export function getRule(id: string): RuleSpec {
  const rule = BY_ID.get(id)
  if (!rule) throw new Error(`Unknown rule id: ${id}`)
  return rule
}

export const IMPLEMENTED_RULES: readonly RuleSpec[] = RULE_CATALOG.filter(
  (r) => r.status === 'IMPLEMENTED',
)

export const SPEC_INCOMPLETE_RULES: readonly RuleSpec[] = RULE_CATALOG.filter(
  (r) => r.status === 'SPEC_INCOMPLETE',
)

/**
 * Severity ordering used for precedence when two rules tie on priority score.
 * Higher wins.
 */
export const SEVERITY_RANK: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
}
