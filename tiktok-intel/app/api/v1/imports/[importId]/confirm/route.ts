/**
 * POST /api/v1/imports/{importId}/confirm (openapi.v1.6.json)
 *
 * Applies user-confirmed column overrides to an import stopped at
 * MAPPING_REQUIRED, then validates and normalizes it. Every override is
 * audited (02_DATA/DATA_MAPPING_SPEC.md — "Manual overrides are audited and
 * never globally alter canonical definitions").
 */

import { cookies } from 'next/headers'
import {
  ApiError,
  audit,
  authenticate,
  badRequest,
  conflict,
  errorResponse,
  jsonResponse,
  newRequestId,
  notFound,
  requireRole,
} from '@/lib/api/http'
import { confirmImportSchema, zodDetails } from '@/lib/api/schemas'
import {
  downloadUpload,
  mappingSummary,
  persistIssues,
  persistNormalizedRows,
  prepareImport,
} from '@/lib/ingestion/import-service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { importId: string } }) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)
    requireRole(actor, 'MARKETER')

    const body = await request.json().catch(() => ({ overrides: [] }))
    const parsed = confirmImportSchema.safeParse(body)
    if (!parsed.success) {
      throw badRequest('The request body does not match the API contract.', zodDetails(parsed.error))
    }

    const { data: importRow, error } = await actor.db
      .from('imports')
      .select(
        'id, shop_id, source_id, source_schema_version, status, import_file_id, import_files(storage_key, original_filename), shops(currency)',
      )
      .eq('id', params.importId)
      .maybeSingle()

    if (error) throw new ApiError(500, 'INTERNAL_ERROR', error.message)
    if (!importRow) throw notFound('That import does not exist, or you do not have access to it.')

    if (importRow.status !== 'MAPPING_REQUIRED') {
      throw conflict(
        `This import is ${importRow.status}, so its mapping cannot be confirmed. Only an import awaiting mapping can be confirmed.`,
        { status: importRow.status },
      )
    }

    const file = importRow.import_files as unknown as {
      storage_key: string
      original_filename: string
    }
    const currency = (importRow.shops as unknown as { currency: string }).currency

    const downloaded = await downloadUpload(actor.db, file.storage_key, file.original_filename)
    const preparation = prepareImport(
      downloaded,
      importRow.source_id as string,
      importRow.source_schema_version as string,
      currency,
      parsed.data.overrides,
    )

    if (preparation.status === 'MAPPING_REQUIRED') {
      await actor.db
        .from('imports')
        .update({ mapping_json: mappingSummary(preparation) })
        .eq('id', params.importId)

      throw badRequest(
        'The mapping is still incomplete after these overrides.',
        {
          missing_required: preparation.mapping.missing_required,
          ambiguous: preparation.mapping.ambiguous,
        },
      )
    }

    const validation = preparation.validation!
    await persistIssues(actor.db, params.importId, validation)

    await audit(
      actor,
      'IMPORT_MAPPING_OVERRIDDEN',
      'import',
      params.importId,
      'SUCCESS',
      requestId,
      { overrides: parsed.data.overrides },
    )

    if (!validation.ok) {
      await actor.db
        .from('imports')
        .update({
          status: 'FAILED',
          mapping_state: preparation.mapping.state,
          mapping_json: mappingSummary(preparation),
          validation_summary: validation.summary,
        })
        .eq('id', params.importId)

      return jsonResponse(
        { id: params.importId, status: 'FAILED', validation_summary: validation.summary },
        200,
        requestId,
      )
    }

    const counts = await persistNormalizedRows(
      actor.db,
      {
        workspaceId: actor.workspace_id,
        shopId: importRow.shop_id as string,
        importId: params.importId,
        currency,
      },
      validation,
    )

    await actor.db
      .from('imports')
      .update({
        status: 'READY',
        mapping_state: 'VALIDATED',
        mapping_json: mappingSummary(preparation),
        provenance_json: validation.provenance,
        validation_summary: validation.summary,
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.importId)

    await actor.db
      .from('import_files')
      .update({ status: 'READY' })
      .eq('id', importRow.import_file_id as string)

    await audit(actor, 'IMPORT_COMPLETED', 'import', params.importId, 'SUCCESS', requestId, counts)

    return jsonResponse(
      { id: params.importId, status: 'READY', validation_summary: validation.summary },
      200,
      requestId,
    )
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
