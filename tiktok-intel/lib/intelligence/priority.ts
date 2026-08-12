/**
 * Priority scoring.
 *
 * The contracts require a priority field on every PROBLEM_DETECTED diagnosis
 * (03_INTELLIGENCE/DECISION_CONTRACT.md) but do not specify a formula. The
 * weighting below is therefore a declared implementation decision, versioned
 * with the diagnostic engine and recorded in CONTRACT_LOCK_REPORT.md
 * (DECISION-002). It is deterministic and fully exposed in the UI.
 *
 *   priority = 0.45·severity + 0.35·impact + 0.20·confidence
 *
 * Severity leads because it encodes the contract author's judgement; impact is
 * measured from the shop's own numbers; confidence damps signals the evidence
 * cannot yet support.
 */

import { SEVERITY_RANK } from '../contracts/rule-catalog'
import type { PriorityBreakdown, Severity } from '../contracts/types'

export const PRIORITY_WEIGHTS = {
  severity: 0.45,
  impact: 0.35,
  confidence: 0.2,
} as const

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

export function severityWeight(severity: Severity): number {
  return SEVERITY_RANK[severity] / SEVERITY_RANK.CRITICAL
}

export interface PriorityInput {
  severity: Severity
  confidence: number
  /**
   * Estimated GMV movement attributable to the signal, in shop currency.
   * Null when the rule cannot express its impact in revenue terms.
   */
  impactValue: number | null
  /** Baseline GMV, used to normalise impact into 0..1. */
  baselineGmv: number | null
  currency: string
}

export function scorePriority(input: PriorityInput): PriorityBreakdown {
  const severity = severityWeight(input.severity)

  // An impact that cannot be measured scores neutral rather than zero, so a
  // high-severity signal is not buried merely because revenue attribution is
  // unavailable.
  const impact =
    input.impactValue === null || input.baselineGmv === null || input.baselineGmv <= 0
      ? 0.5
      : clamp01(Math.abs(input.impactValue) / input.baselineGmv)

  const score =
    severity * PRIORITY_WEIGHTS.severity +
    impact * PRIORITY_WEIGHTS.impact +
    input.confidence * PRIORITY_WEIGHTS.confidence

  return {
    score: Math.round(clamp01(score) * 100_000) / 100_000,
    components: { severity_weight: severity, impact, confidence: input.confidence },
    impact_value: input.impactValue,
    currency: input.currency,
  }
}

/**
 * Deterministic ordering: priority, then severity, then rule id. The rule id
 * tiebreak keeps output stable across runs, which the snapshot contract
 * requires.
 */
export function comparePriority(
  a: { priority: PriorityBreakdown; severity: Severity; rule_id: string },
  b: { priority: PriorityBreakdown; severity: Severity; rule_id: string },
): number {
  if (b.priority.score !== a.priority.score) return b.priority.score - a.priority.score
  if (SEVERITY_RANK[b.severity] !== SEVERITY_RANK[a.severity]) {
    return SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
  }
  return a.rule_id.localeCompare(b.rule_id)
}
