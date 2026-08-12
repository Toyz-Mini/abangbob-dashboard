/** POST /api/v1/analyses (openapi.v1.6.json) */

import { cookies } from 'next/headers'
import {
  ApiError,
  audit,
  authenticate,
  badRequest,
  errorResponse,
  jsonResponse,
  newRequestId,
  notFound,
  requireRole,
  withIdempotency,
} from '@/lib/api/http'
import { createAnalysisSchema, zodDetails } from '@/lib/api/schemas'
import { runAndPersistAnalysis } from '@/lib/db/analysis-repository'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)
    requireRole(actor, 'MARKETER')

    const body = await request.json().catch(() => {
      throw badRequest('The request body must be valid JSON.')
    })
    const parsed = createAnalysisSchema.safeParse(body)
    if (!parsed.success) {
      throw badRequest('The request body does not match the API contract.', zodDetails(parsed.error))
    }

    const { data: shop, error: shopError } = await actor.db
      .from('shops')
      .select('id')
      .eq('id', parsed.data.shop_id)
      .is('deleted_at', null)
      .maybeSingle()

    if (shopError) throw new ApiError(500, 'INTERNAL_ERROR', shopError.message)
    if (!shop) throw notFound('That shop does not exist, or you do not have access to it.')

    const { status, body: responseBody } = await withIdempotency(
      actor,
      'POST /analyses',
      request.headers.get('Idempotency-Key'),
      parsed.data,
      async () => {
        const { data: analysis, error } = await actor.db
          .from('analyses')
          .insert({
            workspace_id: actor.workspace_id,
            shop_id: parsed.data.shop_id,
            status: 'RUNNING',
            period_start: parsed.data.period_start,
            period_end: parsed.data.period_end,
            comparison_start: parsed.data.comparison?.start ?? null,
            comparison_end: parsed.data.comparison?.end ?? null,
            comparison_type: parsed.data.comparison?.type ?? 'PREVIOUS_EQUIVALENT_PERIOD',
            created_by: actor.user_id,
          })
          .select('id')
          .single()

        if (error) throw new ApiError(500, 'INTERNAL_ERROR', error.message)
        const analysisId = analysis!.id as string

        try {
          await runAndPersistAnalysis(actor.db, {
            analysisId,
            workspaceId: actor.workspace_id,
            shopId: parsed.data.shop_id,
            periodStart: parsed.data.period_start,
            periodEnd: parsed.data.period_end,
            comparison: parsed.data.comparison,
          })
        } catch (engineError) {
          // A failed run must leave a FAILED analysis behind rather than one
          // stuck in RUNNING forever.
          await actor.db.from('analyses').update({ status: 'FAILED' }).eq('id', analysisId)
          await audit(actor, 'ANALYSIS_FAILED', 'analysis', analysisId, 'FAILURE', requestId, {
            message: engineError instanceof Error ? engineError.message : 'unknown',
          })
          throw engineError
        }

        await audit(actor, 'ANALYSIS_CREATED', 'analysis', analysisId, 'SUCCESS', requestId, {
          period_start: parsed.data.period_start,
          period_end: parsed.data.period_end,
        })

        return { status: 202, body: { job_id: analysisId, status: 'READY' } }
      },
    )

    return jsonResponse(responseBody, status, requestId)
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
