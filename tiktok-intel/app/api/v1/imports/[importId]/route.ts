/** GET /api/v1/imports/{importId} (openapi.v1.6.json) */

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

export async function GET(_request: Request, { params }: { params: { importId: string } }) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)

    const { data, error } = await actor.db
      .from('imports')
      .select(
        'id, shop_id, source_id, source_schema_version, status, mapping_state, mapping_json, provenance_json, validation_summary, created_at, completed_at, import_files(original_filename, file_type, size_bytes, sha256)',
      )
      .eq('id', params.importId)
      .maybeSingle()

    if (error) throw new ApiError(500, 'INTERNAL_ERROR', error.message)
    if (!data) throw notFound('That import does not exist, or you do not have access to it.')

    const { data: issues, error: issuesError } = await actor.db
      .from('import_validation_issues')
      .select('layer, severity, row_number, column_name, message')
      .eq('import_id', params.importId)
      .order('severity')
      .order('row_number', { nullsFirst: true })
      .limit(200)

    if (issuesError) throw new ApiError(500, 'INTERNAL_ERROR', issuesError.message)

    return jsonResponse(
      { id: data.id, status: data.status, import: data, issues: issues ?? [] },
      200,
      requestId,
    )
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
