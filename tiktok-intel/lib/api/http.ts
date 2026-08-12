/**
 * API envelope, authentication and idempotency.
 *
 * Response shapes follow `openapi/openapi.v1.6.json` exactly: errors are
 * `{ error: { code, message, details?, request_id } }` and every response
 * carries the request id so a user can quote it in a support thread
 * (11_DESIGN/STATE_SPEC.md — Error).
 */

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { serverClient, type CookieStore } from '../db/client'

export const API_BASE = '/api/v1'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const unauthorized = (message = 'Authentication is required.') =>
  new ApiError(401, 'UNAUTHENTICATED', message)

export const forbidden = (message: string, details?: Record<string, unknown>) =>
  new ApiError(403, 'FORBIDDEN', message, details)

export const notFound = (message: string) => new ApiError(404, 'NOT_FOUND', message)

export const badRequest = (message: string, details?: Record<string, unknown>) =>
  new ApiError(400, 'INVALID_REQUEST', message, details)

export const conflict = (message: string, details?: Record<string, unknown>) =>
  new ApiError(409, 'CONFLICT', message, details)

export function newRequestId(): string {
  return randomUUID()
}

export function jsonResponse(body: unknown, status: number, requestId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-request-id': requestId,
      // API responses are per-tenant and must never be cached by a shared cache.
      'cache-control': 'no-store',
    },
  })
}

export function errorResponse(error: unknown, requestId: string): Response {
  if (error instanceof ApiError) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          request_id: requestId,
        },
      },
      error.status,
      requestId,
    )
  }

  // An unexpected failure must not leak internals to the caller; the detail
  // belongs in the server log, correlated by request id.
  console.error(`[${requestId}]`, error)
  return jsonResponse(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The request could not be completed. Quote the request id when reporting this.',
        request_id: requestId,
      },
    },
    500,
    requestId,
  )
}

export type Role = 'OWNER' | 'ADMIN' | 'MARKETER' | 'VIEWER'

export interface Actor {
  user_id: string
  workspace_id: string
  role: Role
  db: SupabaseClient
}

/**
 * Resolves the caller and their role in the workspace.
 *
 * RLS is the enforcement boundary; this check exists so the API can return an
 * intelligible 403 instead of an empty result set
 * (11_DESIGN/STATE_SPEC.md — Permission denied).
 */
export async function authenticate(
  cookies: CookieStore,
  workspaceId: string | null,
): Promise<Actor> {
  const db = serverClient(cookies)
  const { data, error } = await db.auth.getUser()
  if (error || !data.user) throw unauthorized()

  const membershipQuery = db
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', data.user.id)

  const { data: memberships, error: membershipError } = workspaceId
    ? await membershipQuery.eq('workspace_id', workspaceId)
    : await membershipQuery.limit(1)

  if (membershipError) throw new ApiError(500, 'INTERNAL_ERROR', membershipError.message)

  const membership = memberships?.[0]
  if (!membership) {
    throw forbidden(
      workspaceId
        ? 'You are not a member of this workspace. A workspace owner or admin can add you.'
        : 'You do not belong to any workspace yet.',
      { required_role: 'MARKETER' },
    )
  }

  return {
    user_id: data.user.id,
    workspace_id: membership.workspace_id as string,
    role: membership.role as Role,
    db,
  }
}

const RANK: Record<Role, number> = { VIEWER: 1, MARKETER: 2, ADMIN: 3, OWNER: 4 }

export function requireRole(actor: Actor, minimum: Role): void {
  if (RANK[actor.role] < RANK[minimum]) {
    throw forbidden(
      `This action requires the ${minimum} role or higher. Your role is ${actor.role}.`,
      { required_role: minimum, current_role: actor.role },
    )
  }
}

/**
 * Idempotency for mutating requests.
 *
 * Locked by 01_PRODUCT/OPEN_DECISIONS.md: "Mutating POST requests:
 * Idempotency-Key required unless explicitly exempted by API contract."
 *
 * A replay with the same key and the same body returns the stored response. A
 * replay with the same key and a *different* body is a client bug and is
 * refused, rather than silently applying a second, different mutation.
 */
export async function withIdempotency<T>(
  actor: Actor,
  endpoint: string,
  idempotencyKey: string | null,
  requestBody: unknown,
  handler: () => Promise<{ status: number; body: T }>,
): Promise<{ status: number; body: T; replayed: boolean }> {
  if (!idempotencyKey) {
    throw badRequest(
      'An Idempotency-Key header is required for this request so a retry cannot create a duplicate.',
      { header: 'Idempotency-Key' },
    )
  }

  const requestHash = await hashJson(requestBody)

  const { data: existing, error: lookupError } = await actor.db
    .from('idempotency_keys')
    .select('request_hash, response_status, response_json')
    .eq('workspace_id', actor.workspace_id)
    .eq('endpoint', endpoint)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (lookupError) throw new ApiError(500, 'INTERNAL_ERROR', lookupError.message)

  if (existing) {
    if (existing.request_hash !== requestHash) {
      throw conflict(
        'This Idempotency-Key was already used with a different request body. Use a new key for a different request.',
        { header: 'Idempotency-Key' },
      )
    }
    if (existing.response_status === null) {
      throw conflict(
        'A request with this Idempotency-Key is still in progress. Retry shortly.',
        { header: 'Idempotency-Key' },
      )
    }
    return {
      status: existing.response_status as number,
      body: existing.response_json as T,
      replayed: true,
    }
  }

  const { error: claimError } = await actor.db.from('idempotency_keys').insert({
    workspace_id: actor.workspace_id,
    endpoint,
    idempotency_key: idempotencyKey,
    request_hash: requestHash,
  })

  // A unique-violation here means a concurrent request claimed the key first.
  if (claimError && claimError.code === '23505') {
    throw conflict('A request with this Idempotency-Key is already in progress.', {
      header: 'Idempotency-Key',
    })
  }
  if (claimError) throw new ApiError(500, 'INTERNAL_ERROR', claimError.message)

  const result = await handler()

  await actor.db
    .from('idempotency_keys')
    .update({ response_status: result.status, response_json: result.body })
    .eq('workspace_id', actor.workspace_id)
    .eq('endpoint', endpoint)
    .eq('idempotency_key', idempotencyKey)

  return { ...result, replayed: false }
}

async function hashJson(value: unknown): Promise<string> {
  const canonical = JSON.stringify(value ?? null)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Writes an audit record (09_COMPLIANCE/AUDIT_LOGGING.md). */
export async function audit(
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string | null,
  result: 'SUCCESS' | 'FAILURE',
  requestId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await actor.db.from('audit_logs').insert({
    workspace_id: actor.workspace_id,
    actor_user_id: actor.user_id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    result,
    request_id: requestId,
    metadata_json: metadata,
  })
  // An audit write must never mask the outcome of the action it describes, but
  // a silent failure would be worse.
  if (error) console.error(`[${requestId}] audit write failed:`, error.message)
}
