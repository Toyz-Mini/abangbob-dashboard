/**
 * POST /api/v1/imports (openapi.v1.6.json)
 *
 * Registers an uploaded object, hashes and parses it, and either stops at
 * MAPPING_REQUIRED for a human decision or validates straight through.
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
  withIdempotency,
} from '@/lib/api/http'
import { createImportSchema, zodDetails } from '@/lib/api/schemas'
import {
  downloadUpload,
  mappingSummary,
  persistIssues,
  persistNormalizedRows,
  prepareImport,
} from '@/lib/ingestion/import-service'
import { FileRejectedError } from '@/lib/ingestion/parse'
import { UnsupportedSourceError } from '@/lib/ingestion/source-registry'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)
    requireRole(actor, 'MARKETER')

    const body = await request.json().catch(() => {
      throw badRequest('The request body must be valid JSON.')
    })
    const parsed = createImportSchema.safeParse(body)
    if (!parsed.success) {
      throw badRequest('The request body does not match the API contract.', zodDetails(parsed.error))
    }

    const { data: shop, error: shopError } = await actor.db
      .from('shops')
      .select('id, currency')
      .eq('id', parsed.data.shop_id)
      .is('deleted_at', null)
      .maybeSingle()
    if (shopError) throw new ApiError(500, 'INTERNAL_ERROR', shopError.message)
    if (!shop) throw notFound('That shop does not exist, or you do not have access to it.')

    // Clients cannot supply an arbitrary storage key; it must be inside this
    // tenant's own prefix (04_TECHNICAL/UPLOAD_STORAGE_STATE_MACHINE.md).
    const expectedPrefix = `workspaces/${actor.workspace_id}/shops/${parsed.data.shop_id}/imports/`
    if (!parsed.data.storage_key.startsWith(expectedPrefix)) {
      throw badRequest('That storage key does not belong to this shop.')
    }

    const { status, body: responseBody } = await withIdempotency(
      actor,
      'POST /imports',
      request.headers.get('Idempotency-Key'),
      parsed.data,
      async () => {
        const filename = parsed.data.storage_key.split('/').pop() ?? 'upload.csv'

        let file
        try {
          file = await downloadUpload(actor.db, parsed.data.storage_key, filename)
        } catch (error) {
          throw error instanceof FileRejectedError
            ? badRequest(error.message, { code: error.code })
            : new ApiError(400, 'UPLOAD_UNREADABLE', (error as Error).message)
        }

        const { data: importFile, error: fileError } = await actor.db
          .from('import_files')
          .insert({
            workspace_id: actor.workspace_id,
            shop_id: parsed.data.shop_id,
            storage_key: parsed.data.storage_key,
            original_filename: filename,
            file_type: file.fileType,
            size_bytes: file.sizeBytes,
            sha256: file.sha256,
            status: 'PARSING',
            created_by: actor.user_id,
          })
          .select('id')
          .single()

        if (fileError?.code === '23505') {
          throw conflict(
            'This exact file has already been imported for this shop. Importing it again would double-count every row.',
            { sha256: file.sha256 },
          )
        }
        if (fileError) throw new ApiError(500, 'INTERNAL_ERROR', fileError.message)
        const importFileId = importFile!.id as string

        let preparation
        try {
          preparation = prepareImport(
            file,
            parsed.data.source_id,
            parsed.data.source_schema_version,
            shop.currency as string,
          )
        } catch (error) {
          await actor.db.from('import_files').update({ status: 'FAILED' }).eq('id', importFileId)
          if (error instanceof UnsupportedSourceError) {
            throw badRequest(error.message, {
              code: 'UNSUPPORTED_SOURCE',
              source_id: error.source_id,
            })
          }
          if (error instanceof FileRejectedError) {
            throw badRequest(error.message, { code: error.code })
          }
          throw error
        }

        const { data: importRow, error: importError } = await actor.db
          .from('imports')
          .insert({
            workspace_id: actor.workspace_id,
            shop_id: parsed.data.shop_id,
            import_file_id: importFileId,
            source_id: parsed.data.source_id,
            source_schema_version: parsed.data.source_schema_version,
            status: preparation.status === 'READY' ? 'VALIDATING' : preparation.status,
            mapping_state: preparation.mapping.state,
            mapping_json: mappingSummary(preparation),
            provenance_json: preparation.validation?.provenance ?? {},
            validation_summary: preparation.validation?.summary ?? {},
            created_by: actor.user_id,
          })
          .select('id')
          .single()

        if (importError) throw new ApiError(500, 'INTERNAL_ERROR', importError.message)
        const importId = importRow!.id as string

        if (preparation.validation) {
          await persistIssues(actor.db, importId, preparation.validation)
        }

        if (preparation.status === 'READY' && preparation.validation) {
          const counts = await persistNormalizedRows(
            actor.db,
            {
              workspaceId: actor.workspace_id,
              shopId: parsed.data.shop_id,
              importId,
              currency: shop.currency as string,
            },
            preparation.validation,
          )
          await actor.db
            .from('imports')
            .update({ status: 'READY', completed_at: new Date().toISOString() })
            .eq('id', importId)
          await actor.db.from('import_files').update({ status: 'READY' }).eq('id', importFileId)

          await audit(actor, 'IMPORT_COMPLETED', 'import', importId, 'SUCCESS', requestId, counts)
        } else {
          await actor.db
            .from('import_files')
            .update({
              status: preparation.status === 'MAPPING_REQUIRED' ? 'MAPPING_REQUIRED' : 'FAILED',
            })
            .eq('id', importFileId)
          await audit(actor, 'IMPORT_CREATED', 'import', importId, 'SUCCESS', requestId, {
            status: preparation.status,
          })
        }

        return {
          status: 202,
          body: {
            job_id: importId,
            status: preparation.status,
            validation_summary: preparation.validation?.summary ?? {},
          },
        }
      },
    )

    return jsonResponse(responseBody, status, requestId)
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
