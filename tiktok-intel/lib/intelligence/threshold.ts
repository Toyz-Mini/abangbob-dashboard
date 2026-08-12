/**
 * Threshold comparison.
 *
 * Rule triggers are written as inclusive comparisons ("<= -15%"), but the
 * values reaching them are computed through division and subtraction of
 * IEEE-754 doubles. A conversion rate that declines by exactly 15% can compute
 * as -0.14999999999999997, which a naive `<=` would place on the wrong side of
 * its own threshold.
 *
 * A shop sitting exactly on a documented threshold must trigger the rule. The
 * epsilon below is far smaller than any meaningful business movement and far
 * larger than double-precision representation error, so it corrects the
 * artefact without widening the contracted threshold.
 */

export const THRESHOLD_EPSILON = 1e-9

/** True when `value` is at or below `threshold`, tolerant of float error. */
export function atMost(value: number, threshold: number): boolean {
  return value <= threshold + THRESHOLD_EPSILON
}

/** True when `value` is at or above `threshold`, tolerant of float error. */
export function atLeast(value: number, threshold: number): boolean {
  return value >= threshold - THRESHOLD_EPSILON
}

/** True when `value` is strictly below `threshold`, tolerant of float error. */
export function below(value: number, threshold: number): boolean {
  return value < threshold - THRESHOLD_EPSILON
}
