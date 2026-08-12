/**
 * First-run and unconfigured states.
 *
 * 11_DESIGN/STATE_SPEC.md: an empty screen must say why it is empty, what the
 * user can do, and offer a primary action. It must never fill itself with
 * placeholder numbers.
 */

import { AppShell } from './app-shell'
import { Callout, EmptyState } from './primitives'

export function NoAnalysis({ currentPath }: { currentPath: string }) {
  return (
    <AppShell currentPath={currentPath} shopName="No shop selected" synthetic={false}>
      <div className="space-y-6">
        <Callout tone="info" title="This app is not connected to a project yet">
          <p>
            Set <code className="rounded bg-surface px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-surface px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to work
            against your own data, or set <code className="rounded bg-surface px-1">DEMO_MODE=1</code>{' '}
            to explore the interface with a clearly-labelled synthetic dataset.
          </p>
        </Callout>

        <EmptyState
          title="No analysis to show"
          reason="An analysis needs at least one validated import covering the period you want to look at, plus a comparison period to measure against. Nothing has been imported for this shop yet."
          action={
            <a
              href="/imports"
              className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
            >
              Go to data imports
            </a>
          }
        />
      </div>
    </AppShell>
  )
}
