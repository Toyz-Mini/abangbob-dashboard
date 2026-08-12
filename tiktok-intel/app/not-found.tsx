import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/primitives'

export default function NotFound() {
  return (
    <AppShell currentPath="/" shopName="—" synthetic={false}>
      <EmptyState
        title="That page does not exist"
        reason="The link may be out of date, or the analysis it pointed to may have been superseded by a newer one."
        action={
          <Link
            href="/"
            className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
          >
            Back to overview
          </Link>
        }
      />
    </AppShell>
  )
}
