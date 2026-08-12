/** POST /api/v1/shops · GET /api/v1/shops (openapi.v1.6.json) */

import { cookies } from 'next/headers'
import {
  ApiError,
  audit,
  authenticate,
  badRequest,
  errorResponse,
  jsonResponse,
  newRequestId,
  requireRole,
  withIdempotency,
} from '@/lib/api/http'
import { createShopSchema, zodDetails } from '@/lib/api/schemas'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)
    const url = new URL(request.url)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 200)

    const { data, error } = await actor.db
      .from('shops')
      .select('id, name, currency, timezone')
      .is('deleted_at', null)
      .order('name')
      .limit(limit)

    if (error) throw new ApiError(500, 'INTERNAL_ERROR', error.message)
    return jsonResponse({ shops: data ?? [] }, 200, requestId)
  } catch (error) {
    return errorResponse(error, requestId)
  }
}

export async function POST(request: Request) {
  const requestId = newRequestId()
  try {
    const actor = await authenticate(cookies(), null)
    // Creating a shop changes tenant structure, so it is an admin action
    // (06_SECURITY/AUTHORIZATION_MATRIX.md, 0002_rls.sql shops_insert_admin).
    requireRole(actor, 'ADMIN')

    const body = await request.json().catch(() => {
      throw badRequest('The request body must be valid JSON.')
    })
    const parsed = createShopSchema.safeParse(body)
    if (!parsed.success) {
      throw badRequest('The request body does not match the API contract.', zodDetails(parsed.error))
    }

    const { status, body: responseBody } = await withIdempotency(
      actor,
      'POST /shops',
      request.headers.get('Idempotency-Key'),
      parsed.data,
      async () => {
        const { data, error } = await actor.db
          .from('shops')
          .insert({
            workspace_id: actor.workspace_id,
            name: parsed.data.name,
            currency: parsed.data.currency,
            timezone: parsed.data.timezone,
          })
          .select('id, name, currency, timezone')
          .single()

        if (error) throw new ApiError(500, 'INTERNAL_ERROR', error.message)

        await audit(actor, 'SHOP_CREATED', 'shop', data!.id as string, 'SUCCESS', requestId, {
          name: parsed.data.name,
        })

        return { status: 201, body: { shop: data } }
      },
    )

    return jsonResponse(responseBody, status, requestId)
  } catch (error) {
    return errorResponse(error, requestId)
  }
}
