import { NextResponse, type NextRequest } from 'next/server'

/**
 * Per-request Content Security Policy.
 *
 * Next.js injects an inline bootstrap script into every page, so a static
 * `script-src 'self'` header blocks hydration — the page still renders from the
 * server but nothing on it becomes interactive. Loosening the policy to
 * `'unsafe-inline'` would fix hydration by permitting every inline script,
 * including one injected through a cell of an uploaded spreadsheet.
 *
 * A per-request nonce keeps the policy strict: Next.js reads the nonce from
 * this header and stamps it onto its own scripts, and nothing else executes.
 * `'strict-dynamic'` lets those scripts load the chunks they need without
 * having to enumerate each one.
 *
 * `connect-src` is widened to the configured Supabase project only, so the
 * browser can reach the API and storage but nowhere else.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const supabaseOrigin = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) return ''
    try {
      const { origin } = new URL(url)
      return ` ${origin} ${origin.replace('https://', 'wss://')}`
    } catch {
      return ''
    }
  })()

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Tailwind and Next inject style elements without a nonce; styles cannot
    // exfiltrate data the way script can, so inline styles stay permitted.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${supabaseOrigin}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [
    // Static assets are immutable and carry no CSP-relevant surface.
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
