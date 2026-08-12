/**
 * Screen 09 — Data Imports (11_DESIGN/SCREEN_SPEC.md).
 *
 * Shows the source allowlist honestly: the importer accepts only registered
 * formats, and no verified TikTok export is registered yet.
 */

import { AppShell, PageHeader } from '@/components/app-shell'
import { Callout, Card, CardHeader, EmptyState, Pill } from '@/components/primitives'
import { SOURCE_REGISTRY, hasVerifiedTikTokSource } from '@/lib/ingestion/source-registry'
import { MAX_FILE_BYTES, MAX_ROWS } from '@/lib/ingestion/parse'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function ImportsPage() {
  const view = getAnalysisView()

  return (
    <AppShell
      currentPath="/imports"
      shopName={view?.shop.name ?? 'No shop selected'}
      synthetic={view?.synthetic ?? false}
    >
      <PageHeader
        screenId="Screen 09"
        title="Data Imports"
        description="Uploaded CSV and XLSX exports, their validation result and their provenance."
      />

      <div className="space-y-6">
        {!hasVerifiedTikTokSource() ? (
          <Callout tone="warning" title="No TikTok export format is certified yet">
            <p>
              The importer accepts only formats on its allowlist and rejects everything else rather
              than guessing what a column means. Registering a real TikTok export needs a verified
              column inventory, a schema version, a mapping template, validation rules and a golden
              import test — none of which the current documentation supplies. Until then only the
              synthetic development sources below can be imported.
            </p>
          </Callout>
        ) : null}

        <Card>
          <CardHeader
            title="Registered sources"
            description="An upload declaring any other source is refused"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Sources this importer accepts</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="pb-2 pr-4 font-medium">Source</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">Schema</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">Grain</th>
                  <th scope="col" className="pb-2 pr-4 font-medium">Provenance</th>
                  <th scope="col" className="pb-2 font-medium">Required columns</th>
                </tr>
              </thead>
              <tbody>
                {SOURCE_REGISTRY.map((source) => (
                  <tr key={source.source_id} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 pr-4 text-left font-normal text-content">
                      {source.name}
                      <span className="ml-2 text-xs text-muted">{source.source_id}</span>
                    </th>
                    <td className="py-3 pr-4 tabular text-muted">{source.schema_version}</td>
                    <td className="py-3 pr-4 text-muted">{source.grain.replace('_', ' ')}</td>
                    <td className="py-3 pr-4">
                      <Pill tone={source.provenance === 'SYNTHETIC' ? 'warning' : 'neutral'}>
                        {source.provenance}
                      </Pill>
                    </td>
                    <td className="py-3 text-xs text-muted">
                      {source.columns
                        .filter((column) => column.required)
                        .map((column) => column.key)
                        .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <EmptyState
          title="No imports yet"
          reason="Nothing has been uploaded for this shop. An analysis needs at least one validated import covering the period you want to look at, plus a comparison period to measure against."
        />

        <Card>
          <CardHeader title="What the importer will and will not do" />
          <ul className="space-y-2.5 text-sm text-muted">
            <li>
              Accepts <span className="text-content">.csv</span> and{' '}
              <span className="text-content">.xlsx</span> only, up to{' '}
              {(MAX_FILE_BYTES / 1_048_576).toFixed(0)} MB and{' '}
              {MAX_ROWS.toLocaleString('en-MY')} rows.
            </li>
            <li>
              Rejects macro-enabled workbooks outright, and rejects any workbook containing formulas
              or external links. Formulas are never evaluated and their cached values are not
              trusted.
            </li>
            <li>
              Refuses an ambiguous date such as 03/04/2025 rather than guessing between day-first
              and month-first.
            </li>
            <li>
              Stops and asks when two columns could both map to the same field, instead of choosing
              one.
            </li>
            <li>
              Leaves an omitted optional column absent rather than importing it as zero, so a
              missing metric stays missing.
            </li>
            <li>
              Recomputes every ratio from its components. A ratio the export supplied is compared
              against ours and flagged when they disagree, but is never stored as a metric.
            </li>
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}
