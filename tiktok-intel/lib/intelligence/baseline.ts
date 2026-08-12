/**
 * Baseline (comparison period) resolution.
 *
 * The comparison type is part of the analysis record and is persisted on the
 * snapshot, because a diagnosis is only reproducible if the baseline it was
 * measured against is reproducible.
 */

import { daysBetweenInclusive } from '../metrics/period'

export type ComparisonType = 'PREVIOUS_EQUIVALENT_PERIOD' | 'CUSTOM'

export interface ResolvedBaseline {
  start: string
  end: string
  type: ComparisonType
  /**
   * False when the baseline cannot support a valid comparison — for example a
   * custom window of a different length, which would distort every change
   * percentage. CONV-001 requires `comparison_valid=true`.
   */
  comparison_valid: boolean
  invalid_reason: string | null
}

function addDays(date: string, delta: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(ms)) throw new Error(`Invalid date: ${date}`)
  return new Date(ms + delta * 86_400_000).toISOString().slice(0, 10)
}

export function resolveBaseline(
  periodStart: string,
  periodEnd: string,
  comparison?: { type: ComparisonType; start?: string; end?: string },
): ResolvedBaseline {
  const periodDays = daysBetweenInclusive(periodStart, periodEnd)

  if (!comparison || comparison.type === 'PREVIOUS_EQUIVALENT_PERIOD') {
    return {
      start: addDays(periodStart, -periodDays),
      end: addDays(periodStart, -1),
      type: 'PREVIOUS_EQUIVALENT_PERIOD',
      comparison_valid: true,
      invalid_reason: null,
    }
  }

  if (!comparison.start || !comparison.end) {
    throw new Error('CUSTOM comparison requires both start and end')
  }

  const baselineDays = daysBetweenInclusive(comparison.start, comparison.end)
  const sameLength = baselineDays === periodDays
  const overlaps = comparison.end >= periodStart && comparison.start <= periodEnd

  let invalidReason: string | null = null
  if (overlaps) {
    invalidReason =
      'Comparison window overlaps the analysis period; changes would be measured partly against themselves.'
  } else if (!sameLength) {
    invalidReason = `Comparison window is ${baselineDays} days against an analysis period of ${periodDays} days; totals are not comparable.`
  }

  return {
    start: comparison.start,
    end: comparison.end,
    type: 'CUSTOM',
    comparison_valid: invalidReason === null,
    invalid_reason: invalidReason,
  }
}

/**
 * History window used for anomaly detection. ANOM-001 needs at least 14
 * historical observations, so the window is deliberately wider than the
 * baseline.
 */
export function anomalyHistoryWindow(
  periodStart: string,
  days = 60,
): { start: string; end: string } {
  return { start: addDays(periodStart, -days), end: addDays(periodStart, -1) }
}
