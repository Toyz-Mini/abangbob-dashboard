/**
 * Decision contract types (03_INTELLIGENCE/DECISION_CONTRACT.md).
 *
 * These types are the boundary between the deterministic engine and every
 * consumer (API, UI, AI explanation layer). The AI layer may read them but
 * may never produce or alter them (CLAUDE.md — non-negotiable rules).
 */

/** Terminal status of a completed analysis. */
export type DecisionStatus =
  | 'HEALTHY'
  | 'PROBLEM_DETECTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'DATA_INVALID'
  | 'ANOMALY'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ConfidenceLabel = 'LOW' | 'MEDIUM' | 'HIGH'

export type Effort = 'LOW' | 'MEDIUM' | 'HIGH'
export type Risk = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Attribution labels (02_DATA/ATTRIBUTION_SPEC.md).
 * Totals carrying different labels must never be added together.
 */
export type AttributionContext =
  | 'SHOP_TOTAL'
  | 'PAID'
  | 'ORGANIC'
  | 'GMV_MAX'
  | 'LIVE'
  | 'AFFILIATE'
  | 'UNKNOWN'

/**
 * Confounders that suppress rules (03_INTELLIGENCE/P0_RULE_CATALOG_V1.json —
 * `suppression` arrays). Identifiers match the catalog strings exactly.
 */
export type ConfounderId =
  | 'STOCKOUT_CONFOUNDER'
  | 'DATA-INVALID'
  | 'ATTRIBUTION-INCOMPATIBLE'

export interface ConfounderFinding {
  id: ConfounderId
  detected: boolean
  /** Human-readable reason. Empty when `detected` is false. */
  reason: string
  /** Machine-readable supporting values. */
  detail: Record<string, unknown>
  /**
   * False when the detector cannot run at all for this analysis (e.g. the
   * required input is absent from the contracted schema). An undetectable
   * confounder is surfaced as a limitation, never as "no confounder".
   */
  evaluated: boolean
}

/** A single quantified fact backing a diagnosis. Never AI-generated. */
export interface EvidenceItem {
  rule_id: string
  metric_name: string
  current_value: number | null
  baseline_value: number | null
  change_pct: number | null
  /** Rule threshold this metric was compared against, when applicable. */
  threshold: number | null
  attribution: AttributionContext
  evidence_json: Record<string, unknown>
}

export interface ConfidenceBreakdown {
  score: number
  label: ConfidenceLabel
  components: {
    data_completeness: number
    signal_strength: number
    cross_signal_agreement: number
    sample_sufficiency: number
  }
  model_version: string
}

export interface PriorityBreakdown {
  score: number
  components: {
    severity_weight: number
    impact: number
    confidence: number
  }
  /** Estimated GMV movement attributable to the signal, in shop currency. */
  impact_value: number | null
  currency: string
}

export interface MonitorPlan {
  metrics: string[]
  window_days: number
  note: string
}

export interface Recommendation {
  action_id: string
  action_text: string
  effort: Effort
  risk: Risk
  /** Direction the target metric is expected to move. Not a guarantee. */
  expected_direction: 'INCREASE' | 'DECREASE' | 'STABILISE' | null
  prerequisites: string[]
  success_criteria: {
    metric: string
    direction: 'INCREASE' | 'DECREASE'
    min_change_pct: number
    observation_days: number
  }
}

/** One diagnosis produced by exactly one rule. */
export interface Diagnosis {
  rule_id: string
  rule_name: string
  status: DecisionStatus
  severity: Severity
  confidence: ConfidenceBreakdown
  priority: PriorityBreakdown
  /** What the data shows. Factual, no causal claim. */
  observation: string
  /** What the engine concludes. Observational, not causal. */
  diagnosis: string
  /** Candidate explanation to be tested. Explicitly unproven. */
  hypothesis: string
  /** What must not be changed while this is being investigated. */
  dont_touch: string
  monitor: MonitorPlan
  limitations: string[]
  evidence: EvidenceItem[]
  recommendations: Recommendation[]
}

export interface SuppressedDiagnosis {
  rule_id: string
  rule_name: string
  suppressed: true
  suppression_reason: ConfounderId
  detail: string
}

export interface HealthScore {
  score: number | null
  label: 'CRITICAL' | 'AT_RISK' | 'FAIR' | 'GOOD' | 'STRONG' | null
  dimensions: Array<{
    id: 'TRAFFIC' | 'CONVERSION' | 'PRODUCT' | 'ADS' | 'GROWTH'
    /** null when the dimension has no data — reweighted, never scored zero. */
    score: number | null
    /** Effective weight after reweighting missing dimensions. */
    weight: number
    available: boolean
  }>
  data_coverage: number
  confidence: ConfidenceLabel
  version: string
}

/** The complete, reproducible output of one analysis run. */
export interface AnalysisResult {
  status: DecisionStatus
  /** Highest-priority diagnosis, or null for HEALTHY/INSUFFICIENT_EVIDENCE. */
  primary: Diagnosis | null
  diagnoses: Diagnosis[]
  suppressed: SuppressedDiagnosis[]
  confounders: ConfounderFinding[]
  health: HealthScore
  limitations: string[]
  /** Rules that are in declared P0 scope but have no implementable spec. */
  unevaluated_rules: Array<{ rule_id: string; reason: string }>
  versions: {
    metric_version: string
    rule_set_version: string
    diagnostic_engine_version: string
  }
}
