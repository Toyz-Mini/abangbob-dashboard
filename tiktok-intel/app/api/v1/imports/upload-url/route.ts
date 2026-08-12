/**
 * POST /api/v1/imports/upload-url (openapi.v1.6.json)
 *
 * Implements the REQUESTED step of 04_TECHNICAL/UPLOAD_STORAGE_STATE_MACHINE.md:
 * the storage key is server-generated, the client cannot choose a bucket or
 * path, size and type are checked server-side, and the URL expires.
 */

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
} from '@/lib/api/http'
import { createUploadUrlSchema, zodDetails } from '@/lib/api/schemas'
import { assertAllowedFile, buildStorageKey, FileRejectedError } from '@/lib/ingestion/parse'
import { UPLOAD_BUCKET } from '@/lib/ingestion/import-service'

export const dynamic = 'force-dynamic'

const UPLOAD_URL_TTL_SECONDS = 600

export async function POST(request: Request) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)
    requireRole(actor, 'MARKETER')

    const body = await request.json().catch(() => {
      throw badRequest('The request body must be valid JSON.')
    })
    const parsed = createUploadUrlSchema.safeParse(body)
    if (!parsed.success) {
      throw badRequest('The request body does not match the API contract.', zodDetails(parsed.error))
    }

    try {
      const detected = assertAllowedFile(
        parsed.data.filename,
        parsed.data.size_bytes,
        undefined,
      )
      if (detected !== parsed.data.file_type) {
        throw badRequest(
          `The filename indicates a ${detected} file but ${parsed.data.file_type} was declared.`,
        )
      }
    } catch (error) {
      if (error instanceof FileRejectedError) {
        throw badRequest(error.message, { code: error.code })
      }
      throw error
    }

    const { data: shop, error: shopError } = await actor.db
      .from('shops')
      .select('id')
      .eq('id', parsed.data.shop_id)
      .is('deleted_at', null)
      .maybeSingle()
    if (shopError) throw new ApiError(500, 'INTERNAL_ERROR', shopError.message)
    if (!shop) throw notFound('That shop does not exist, or you do not have access to it.')

    const importFileId = crypto.randomUUID()
    const storageKey = buildStorageKey(
      actor.workspace_id,
      parsed.data.shop_id,
      importFileId,
      parsed.data.file_type,
    )

    const { data: signed, error: signError } = await actor.db.storage
      .from(UPLOAD_BUCKET)
      .createSignedUploadUrl(storageKey)

    if (signError) throw new ApiError(500, 'STORAGE_ERROR', signError.message)

    await audit(actor, 'UPLOAD_URL_ISSUED', 'import_file', importFileId, 'SUCCESS', requestId, {
      storage_key: storageKey,
      size_bytes: parsed.data.size_bytes,
    })

    return jsonResponse(
      {
        upload_url: signed!.signedUrl,
        storage_key: storageKey,
        expires_in: UPLOAD_URL_TTL_SECONDS,
      },
      201,
      requestId,
    )
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
