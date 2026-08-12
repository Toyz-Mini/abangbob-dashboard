/**
 * Golden-vector regression suite.
 *
 * Every vector runs through the real `runAnalysis` entry point — the same code
 * path the API uses — so a passing run is evidence about the shipped engine,
 * not about a test double.
 *
 * The suite also enforces the coverage requirement itself: every rule marked
 * IMPLEMENTED must carry the vector categories 07_QA/P0_GOLDEN_VECTOR_
 * REQUIREMENTS.md demands.
 */

import { describe, expect, it } from 'vitest'
import { runAnalysis } from '../../lib/intelligence/engine'
import { IMPLEMENTED_RULES } from '../../lib/contracts/rule-catalog'
import { PERIOD } from '../support/build'
import { materialise, VECTORS, type GoldenVector } from './vectors'

function analyse(vector: GoldenVector) {
  const { dailyRows, productRows, events } = materialise(vector)
  return runAnalysis({
    period_start: PERIOD.start,
    period_end: PERIOD.end,
    dailyRows,
    productRows,
    events,
    currency: 'MYR',
  })
}

describe('P0 golden vectors', () => {
  for (const vector of VECTORS) {
    it(`${vector.id} — ${vector.description}`, () => {
      const result = analyse(vector)

      const triggered = result.diagnoses.filter((d) => d.rule_id === vector.rule)
      const suppressed = result.suppressed.filter((s) => s.rule_id === vector.rule)
      const notEvaluable = result.limitations.filter((l) =>
        l.startsWith(`${vector.rule} could not be evaluated`),
      )

      switch (vector.expected.outcome) {
        case 'TRIGGERED': {
          expect(
            triggered.length,
            `expected ${vector.rule} to trigger; suppressed=${suppressed.length}, limitations=${JSON.stringify(result.limitations)}`,
          ).toBeGreaterThan(0)
          if (vector.expected.confidence) {
            expect(triggered[0]!.confidence.label).toBe(vector.expected.confidence)
          }
          // A triggered rule must always ship the full decision contract.
          for (const diagnosis of triggered) {
            expect(diagnosis.observation.length).toBeGreaterThan(0)
            expect(diagnosis.diagnosis.length).toBeGreaterThan(0)
            expect(diagnosis.hypothesis.length).toBeGreaterThan(0)
            expect(diagnosis.dont_touch.length).toBeGreaterThan(0)
            expect(diagnosis.evidence.length).toBeGreaterThan(0)
            expect(diagnosis.monitor.metrics.length).toBeGreaterThan(0)
            expect(diagnosis.limitations.length).toBeGreaterThan(0)
            expect(diagnosis.recommendations.length).toBeGreaterThan(0)
            expect(diagnosis.confidence.score).toBeGreaterThanOrEqual(0)
            expect(diagnosis.confidence.score).toBeLessThanOrEqual(1)
            expect(diagnosis.priority.score).toBeGreaterThanOrEqual(0)
            expect(diagnosis.priority.score).toBeLessThanOrEqual(1)
          }
          break
        }
        case 'SUPPRESSED': {
          expect(
            suppressed.length,
            `expected ${vector.rule} to be suppressed; triggered=${triggered.length}`,
          ).toBeGreaterThan(0)
          expect(triggered.length).toBe(0)
          if (vector.expected.suppression_reason) {
            expect(suppressed[0]!.suppression_reason).toBe(vector.expected.suppression_reason)
          }
          break
        }
        case 'NOT_EVALUABLE': {
          expect(
            notEvaluable.length,
            `expected ${vector.rule} to be reported as not evaluable; limitations=${JSON.stringify(result.limitations)}`,
          ).toBeGreaterThan(0)
          expect(triggered.length).toBe(0)
          break
        }
        case 'NOT_TRIGGERED': {
          expect(
            triggered.length,
            `expected ${vector.rule} not to trigger`,
          ).toBe(0)
          break
        }
      }

      if (vector.expected.status) {
        expect(result.status).toBe(vector.expected.status)
      }
    })
  }
})

describe('golden vector coverage', () => {
  const byRule = new Map<string, Set<string>>()
  for (const vector of VECTORS) {
    const set = byRule.get(vector.rule) ?? new Set<string>()
    set.add(vector.category)
    byRule.set(vector.rule, set)
  }

  for (const rule of IMPLEMENTED_RULES) {
    it(`${rule.id} has a positive-or-terminal and a negative vector`, () => {
      const categories = byRule.get(rule.id)
      expect(categories, `${rule.id} has no golden vectors at all`).toBeDefined()
      // DATA-001 terminates the analysis rather than emitting a diagnosis, so
      // its "positive" case is expressed as a MISSING_DATA vector.
      expect(
        categories!.has('POSITIVE') || categories!.has('MISSING_DATA'),
        `${rule.id} lacks a positive trigger vector`,
      ).toBe(true)
      expect(categories!.has('NEGATIVE'), `${rule.id} lacks a negative vector`).toBe(true)
    })

    it(`${rule.id} has a boundary vector where a threshold exists`, () => {
      if (rule.primary_threshold === null) return
      const categories = byRule.get(rule.id)
      expect(
        categories?.has('BOUNDARY'),
        `${rule.id} has threshold ${rule.primary_threshold} but no boundary vector`,
      ).toBe(true)
    })

    it(`${rule.id} has a suppression vector where confounders apply`, () => {
      if (rule.suppression.length === 0) return
      const categories = byRule.get(rule.id)
      expect(
        categories?.has('SUPPRESSION'),
        `${rule.id} lists confounders ${rule.suppression.join(', ')} but has no suppression vector`,
      ).toBe(true)
    })

    it(`${rule.id} has an insufficient-sample vector where a sample gate exists`, () => {
      if (rule.minimum_sample === null) return
      const categories = byRule.get(rule.id)
      expect(
        categories?.has('INSUFFICIENT_SAMPLE'),
        `${rule.id} gates on ${rule.minimum_sample.metric} >= ${rule.minimum_sample.value} but has no insufficient-sample vector`,
      ).toBe(true)
    })
  }
})

describe('engine determinism', () => {
  it('produces byte-identical results across runs', () => {
    const vector = VECTORS.find((v) => v.id === 'CONV-001-positive-001')!
    const first = JSON.stringify(analyse(vector))
    const second = JSON.stringify(analyse(vector))
    expect(first).toBe(second)
  })
})
