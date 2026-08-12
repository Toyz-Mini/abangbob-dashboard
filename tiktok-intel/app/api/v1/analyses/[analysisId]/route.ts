/** GET /api/v1/analyses/{analysisId} (openapi.v1.6.json) */

import { cookies } from 'next/headers'
import {
  ApiError,
  authenticate,
  errorResponse,
  jsonResponse,
  newRequestId,
  notFound,
} from '@/lib/api/http'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { analysisId: string } },
) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)

    const { data: analysis, error } = await actor.db
      .from('analyses')
      .select('id, shop_id, status, period_start, period_end, comparison_start, comparison_end, comparison_type, created_at, completed_at')
      .eq('id', params.analysisId)
      .maybeSingle()

    if (error) throw new ApiError(500, 'INTERNAL_ERROR', error.message)
    if (!analysis) throw notFound('That analysis does not exist, or you do not have access to it.')

    const { data: snapshot, error: snapshotError } = await actor.db
      .from('analysis_snapshots')
      .select('id, source_import_ids, metric_version, diagnostic_engine_version, rule_set_version, baseline_json, normalized_data_hash, created_at')
      .eq('analysis_id', analysis.id)
      .maybeSingle()

    if (snapshotError) throw new ApiError(500, 'INTERNAL_ERROR', snapshotError.message)

    let diagnoses: unknown[] = []
    if (snapshot) {
      const { data, error: diagnosisError } = await actor.db
        .from('diagnoses')
        .select(
          'id, rule_id, status, severity, confidence_score, priority_score, observation, diagnosis, hypothesis, dont_touch, monitor_json, limitations_json, recommendations(action_id, action_text, effort, risk, expected_direction, prerequisites_json, success_criteria_json)',
        )
        .eq('analysis_snapshot_id', snapshot.id)
        .order('priority_score', { ascending: false })

      if (diagnosisError) throw new ApiError(500, 'INTERNAL_ERROR', diagnosisError.message)
      diagnoses = data ?? []
    }

    return jsonResponse({ analysis, snapshot, diagnoses }, 200, requestId)
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
