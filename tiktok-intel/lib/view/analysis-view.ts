/**
 * Screen view model.
 *
 * Single place where screens obtain an analysis. Pages stay presentational;
 * no diagnostic logic lives in a component (CLAUDE.md, and
 * 11_DESIGN/DESIGN_TO_CODE_CONTRACT.md rule 5).
 */

import type { AnalysisResult } from '../contracts/types'
import { DEMO_PERIOD, DEMO_SHOP, demoDailyRows, demoEvents, demoProductRows, isDemoMode } from '../demo/dataset'
import { resolveBaseline } from '../intelligence/baseline'
import { runAnalysis } from '../intelligence/engine'
import {
  aggregatePeriod,
  aggregateProducts,
  buildChangeSet,
  type ChangeSet,
  type PeriodMetrics,
  type ProductPeriodMetrics,
} from '../metrics/period'

export interface AnalysisView {
  shop: { id: string; name: string; currency: string; timezone: string }
  period: { start: string; end: string }
  baseline: { start: string; end: string; type: string; comparison_valid: boolean }
  result: AnalysisResult
  current: PeriodMetrics
  previous: PeriodMetrics
  changes: ChangeSet
  products: { current: ProductPeriodMetrics[]; previous: ProductPeriodMetrics[] }
  /** True when the data behind this view is synthetic. Surfaced on every screen. */
  synthetic: boolean
  /** Timestamp of the most recent day of data. */
  data_through: string | null
  generated_at: string
}

/**
 * Builds the view for the demo dataset.
 *
 * A Supabase-backed equivalent lives in `lib/db/analysis-repository.ts`; this
 * path exists so the UI can be built and reviewed before a certified TikTok
 * export is registered.
 */
export function buildDemoView(): AnalysisView {
  const dailyRows = demoDailyRows()
  const productRows = demoProductRows()
  const events = demoEvents()

  const baseline = resolveBaseline(DEMO_PERIOD.start, DEMO_PERIOD.end)

  const result = runAnalysis({
    period_start: DEMO_PERIOD.start,
    period_end: DEMO_PERIOD.end,
    dailyRows,
    productRows,
    events,
    currency: DEMO_SHOP.currency,
  })

  const current = aggregatePeriod(dailyRows, DEMO_PERIOD.start, DEMO_PERIOD.end, DEMO_SHOP.currency)
  const previous = aggregatePeriod(dailyRows, baseline.start, baseline.end, DEMO_SHOP.currency)

  const dataThrough = dailyRows
    .map((row) => row.business_date)
    .sort()
    .at(-1) ?? null

  return {
    shop: DEMO_SHOP,
    period: DEMO_PERIOD,
    baseline: {
      start: baseline.start,
      end: baseline.end,
      type: baseline.type,
      comparison_valid: baseline.comparison_valid,
    },
    result,
    current,
    previous,
    changes: buildChangeSet(current, previous),
    products: {
      current: aggregateProducts(productRows, DEMO_PERIOD.start, DEMO_PERIOD.end),
      previous: aggregateProducts(productRows, baseline.start, baseline.end),
    },
    synthetic: true,
    data_through: dataThrough,
    generated_at: new Date().toISOString(),
  }
}

/**
 * Returns the analysis a screen should render.
 *
 * Returns null when the app is configured against a real project — those
 * screens read a persisted analysis rather than computing one on request, and
 * showing demo numbers there would be exactly the fabrication the design
 * contract forbids.
 */
export function getAnalysisView(): AnalysisView | null {
  return isDemoMode() ? buildDemoView() : null
}
