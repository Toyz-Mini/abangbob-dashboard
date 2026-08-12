/**
 * Analysis persistence.
 *
 * Reads the normalized rows an analysis needs, runs the deterministic engine
 * and writes an immutable snapshot with everything required to replay it:
 * source imports, all three contract versions, the baseline, and a hash of the
 * exact rows consumed (0001_initial_schema.sql — analysis_snapshots).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_SCHEMA_VERSION } from '../contracts/versions'
import type { AnalysisResult } from '../contracts/types'
import { normalizedDataHash, runAnalysis } from '../intelligence/engine'
import { resolveBaseline, type ComparisonType } from '../intelligence/baseline'
import type { BusinessEvent } from '../intelligence/confounders'
import type { DailyMetricRow, DailyProductMetricRow } from '../metrics/period'

/** Widest window the engine reads: 60 days of anomaly history plus a baseline. */
const HISTORY_LOOKBACK_DAYS = 90

function shiftDays(date: string, delta: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + delta * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

interface RawDailyRow extends DailyMetricRow {
  source_import_id: string
}

/**
 * Resolves overlapping imports.
 *
 * The contract's unique key is (shop_id, business_date, source_import_id), so
 * re-importing a date leaves both rows in place without saying which is
 * authoritative. The most recently completed READY import wins, and the
 * superseded rows are ignored rather than deleted, preserving the audit trail.
 * See CONTRACT_LOCK_REPORT.md (DELTA-007).
 */
function resolveLatestPerDate(
  rows: RawDailyRow[],
  importRank: Map<string, number>,
): DailyMetricRow[] {
  const winner = new Map<string, { rank: number; row: RawDailyRow }>()
  for (const row of rows) {
    const rank = importRank.get(row.source_import_id) ?? -1
    const existing = winner.get(row.business_date)
    if (!existing || rank > existing.rank) {
      winner.set(row.business_date, { rank, row })
    }
  }
  return [...winner.values()].map(({ row }) => {
    const { source_import_id: _ignored, ...metrics } = row
    return metrics
  })
}

export interface AnalysisInputs {
  dailyRows: DailyMetricRow[]
  productRows: DailyProductMetricRow[]
  events: BusinessEvent[]
  sourceImportIds: string[]
  importValidationErrors: string[]
  currency: string
}

export async function loadAnalysisInputs(
  db: SupabaseClient,
  shopId: string,
  periodStart: string,
  periodEnd: string,
): Promise<AnalysisInputs> {
  const windowStart = shiftDays(periodStart, -HISTORY_LOOKBACK_DAYS)

  const [shopResult, importsResult, dailyResult, productResult, eventsResult] = await Promise.all([
    db.from('shops').select('currency').eq('id', shopId).single(),
    db
      .from('imports')
      .select('id, completed_at, status')
      .eq('shop_id', shopId)
      .eq('status', 'READY')
      .order('completed_at', { ascending: true }),
    db
      .from('normalized_daily_metrics')
      .select('*')
      .eq('shop_id', shopId)
      .gte('business_date', windowStart)
      .lte('business_date', periodEnd),
    db
      .from('normalized_product_metrics')
      .select('*')
      .eq('shop_id', shopId)
      .gte('business_date', windowStart)
      .lte('business_date', periodEnd),
    db
      .from('business_events')
      .select('event_type, name, start_at, end_at, scope_json')
      .eq('shop_id', shopId)
      .lte('start_at', `${periodEnd}T23:59:59Z`)
      .gte('end_at', `${periodStart}T00:00:00Z`),
  ])

  for (const result of [shopResult, importsResult, dailyResult, productResult, eventsResult]) {
    if (result.error) throw new Error(result.error.message)
  }

  const importRank = new Map<string, number>()
  ;(importsResult.data ?? []).forEach((row, index) => {
    importRank.set(row.id as string, index)
  })

  const dailyRows = resolveLatestPerDate((dailyResult.data ?? []) as RawDailyRow[], importRank)

  const sourceImportIds = [
    ...new Set(((dailyResult.data ?? []) as RawDailyRow[]).map((r) => r.source_import_id)),
  ].sort()

  return {
    dailyRows,
    productRows: (productResult.data ?? []) as DailyProductMetricRow[],
    events: (eventsResult.data ?? []) as BusinessEvent[],
    sourceImportIds,
    importValidationErrors: [],
    currency: (shopResult.data?.currency as string) ?? 'MYR',
  }
}

export interface PersistedAnalysis {
  analysis_id: string
  snapshot_id: string
  result: AnalysisResult
}

/**
 * Runs and persists an analysis.
 *
 * Ordering matters: the snapshot is written before any diagnosis, so a
 * diagnosis can never exist without the versioned context that produced it.
 */
export async function runAndPersistAnalysis(
  db: SupabaseClient,
  params: {
    analysisId: string
    workspaceId: string
    shopId: string
    periodStart: string
    periodEnd: string
    comparison?: { type: ComparisonType; start?: string; end?: string }
  },
): Promise<PersistedAnalysis> {
  const inputs = await loadAnalysisInputs(db, params.shopId, params.periodStart, params.periodEnd)
  const baseline = resolveBaseline(params.periodStart, params.periodEnd, params.comparison)

  const result = runAnalysis({
    period_start: params.periodStart,
    period_end: params.periodEnd,
    comparison: params.comparison,
    dailyRows: inputs.dailyRows,
    productRows: inputs.productRows,
    events: inputs.events,
    importValidationErrors: inputs.importValidationErrors,
    currency: inputs.currency,
  })

  const { data: snapshot, error: snapshotError } = await db
    .from('analysis_snapshots')
    .insert({
      analysis_id: params.analysisId,
      source_import_ids: inputs.sourceImportIds,
      metric_version: result.versions.metric_version,
      diagnostic_engine_version: result.versions.diagnostic_engine_version,
      rule_set_version: result.versions.rule_set_version,
      ai_schema_version: AI_SCHEMA_VERSION,
      baseline_json: {
        start: baseline.start,
        end: baseline.end,
        type: baseline.type,
        comparison_valid: baseline.comparison_valid,
        invalid_reason: baseline.invalid_reason,
      },
      normalized_data_hash: normalizedDataHash(inputs.dailyRows, inputs.productRows),
    })
    .select('id')
    .single()

  if (snapshotError) throw new Error(snapshotError.message)
  const snapshotId = snapshot!.id as string

  for (const diagnosis of result.diagnoses) {
    const { data: diagnosisRow, error: diagnosisError } = await db
      .from('diagnoses')
      .insert({
        analysis_snapshot_id: snapshotId,
        status: diagnosis.status,
        rule_id: diagnosis.rule_id,
        severity: diagnosis.severity,
        confidence_score: diagnosis.confidence.score,
        priority_score: diagnosis.priority.score,
        observation: diagnosis.observation,
        diagnosis: diagnosis.diagnosis,
        hypothesis: diagnosis.hypothesis,
        dont_touch: diagnosis.dont_touch,
        monitor_json: diagnosis.monitor,
        limitations_json: diagnosis.limitations,
      })
      .select('id')
      .single()

    if (diagnosisError) throw new Error(diagnosisError.message)
    const diagnosisId = diagnosisRow!.id as string

    if (diagnosis.evidence.length > 0) {
      const { error } = await db.from('evidence').insert(
        diagnosis.evidence.map((item) => ({
          analysis_snapshot_id: snapshotId,
          rule_id: item.rule_id,
          metric_name: item.metric_name,
          current_value: item.current_value,
          baseline_value: item.baseline_value,
          change_pct: item.change_pct,
          threshold: item.threshold,
          evidence_json: { ...item.evidence_json, attribution: item.attribution },
        })),
      )
      if (error) throw new Error(error.message)
    }

    if (diagnosis.recommendations.length > 0) {
      const { error } = await db.from('recommendations').insert(
        diagnosis.recommendations.map((recommendation) => ({
          diagnosis_id: diagnosisId,
          action_id: recommendation.action_id,
          action_text: recommendation.action_text,
          effort: recommendation.effort,
          risk: recommendation.risk,
          expected_direction: recommendation.expected_direction,
          prerequisites_json: recommendation.prerequisites,
          success_criteria_json: recommendation.success_criteria,
        })),
      )
      if (error) throw new Error(error.message)
    }
  }

  const { error: completeError } = await db
    .from('analyses')
    .update({ status: 'READY', completed_at: new Date().toISOString() })
    .eq('id', params.analysisId)

  if (completeError) throw new Error(completeError.message)

  return { analysis_id: params.analysisId, snapshot_id: snapshotId, result }
}
