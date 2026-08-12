/**
 * Supabase clients.
 *
 * Three distinct clients, because they carry different authority:
 *
 *   browserClient  — anon key, user session, RLS enforced.
 *   serverClient   — anon key + the request's cookies, RLS enforced. Used by
 *                    every route handler that acts on behalf of a user.
 *   serviceClient  — service role, RLS bypassed. Server-only, and never
 *                    reachable from a browser bundle
 *                    (0002_rls.sql closing note, 06_SECURITY/SECRETS_MANAGEMENT.md).
 */

import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface CookieStore {
  get(name: string): { value: string } | undefined
  set(options: { name: string; value: string } & CookieOptions): void
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and provide your Supabase project settings.`,
    )
  }
  return value
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export function browserClient(): SupabaseClient {
  return createBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}

export function serverClient(cookies: CookieStore): SupabaseClient {
  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get: (name: string) => cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookies.set({ name, value, ...options })
          } catch {
            // Server Components cannot set cookies. Session refresh happens in
            // middleware, so a failure here is expected and not an error.
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookies.set({ name, value: '', ...options })
          } catch {
            // See above.
          }
        },
      },
    },
  )
}

/**
 * Service-role client. Guarded at runtime rather than by convention: if this
 * module is ever pulled into a browser bundle the call fails loudly instead of
 * shipping a service key to the client.
 */
export function serviceClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('The service-role client must never be constructed in the browser.')
  }
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
