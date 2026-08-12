/** Screen 03 — Insights (11_DESIGN/SCREEN_SPEC.md). */

import { AppShell, PageHeader } from '@/components/app-shell'
import { DiagnosisCard } from '@/components/diagnosis'
import { NoAnalysis } from '@/components/no-analysis'
import { Callout, Card, CardHeader, EmptyState, Pill } from '@/components/primitives'
import { formatDateRange } from '@/lib/format'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function InsightsPage() {
  const view = getAnalysisView()
  if (!view) return <NoAnalysis currentPath="/insights" />

  const { result, current, shop } = view

  return (
    <AppShell currentPath="/insights" shopName={shop.name} synthetic={view.synthetic}>
      <PageHeader
        screenId="Screen 03"
        title="Insights"
        description="What changed, how confident we are, what it is worth, the evidence, and what to do."
        meta={
          <>
            <Pill>{formatDateRange(view.period.start, view.period.end)}</Pill>
            <Pill>Status {result.status.replace('_', ' ')}</Pill>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card as="aside">
            <CardHeader title="Severity" />
            <ul className="space-y-1.5 text-sm">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => {
                const count = result.diagnoses.filter((d) => d.severity === severity).length
                return (
                  <li key={severity} className="flex justify-between text-muted">
                    <span>{severity}</span>
                    <span className="tabular">{count}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card as="aside">
            <CardHeader title="Category" />
            <ul className="space-y-1.5 text-sm">
              {[...new Set(result.diagnoses.map((d) => d.rule_id.split('-')[0]!))].map((family) => (
                <li key={family} className="flex justify-between text-muted">
                  <span>{family}</span>
                  <span className="tabular">
                    {result.diagnoses.filter((d) => d.rule_id.startsWith(`${family}-`)).length}
                  </span>
                </li>
              ))}
              {result.diagnoses.length === 0 ? <li className="text-muted">None</li> : null}
            </ul>
          </Card>
        </aside>

        <div className="space-y-6">
          {result.status === 'HEALTHY' ? (
            <EmptyState
              title="No material issues detected for this period"
              reason="Nothing crossed a diagnostic threshold. The engine does not manufacture an insight to fill the page."
            />
          ) : null}

          {result.diagnoses.map((diagnosis, index) => (
            <DiagnosisCard
              key={`${diagnosis.rule_id}-${index}`}
              diagnosis={diagnosis}
              currency={current.currency}
              rank={index + 1}
            />
          ))}

          {result.suppressed.length > 0 ? (
            <Card>
              <CardHeader
                title="Suppressed findings"
                description="These rules matched, but a confounder makes the reading unreliable. They are shown rather than hidden."
              />
              <ul className="space-y-3">
                {result.suppressed.map((item, index) => (
                  <li key={`${item.rule_id}-${index}`} className="rounded border border-line p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-content">{item.rule_name}</span>
                      <span className="text-xs text-muted">{item.rule_id}</span>
                      <Pill tone="warning">{item.suppression_reason}</Pill>
                    </div>
                    {item.detail ? (
                      <p className="mt-1.5 text-sm text-muted">{item.detail}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {result.unevaluated_rules.length > 0 ? (
            <Callout
              tone="warning"
              title={`${result.unevaluated_rules.length} rules in MVP scope were not evaluated`}
            >
              <p className="mb-2">
                These rules are declared in the P0 coverage map but carry no implementable trigger.
                They are listed so the gap is visible rather than silent.
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {result.unevaluated_rules.map((rule) => (
                  <li key={rule.rule_id}>
                    <span className="font-medium">{rule.rule_id}</span> — {rule.reason}
                  </li>
                ))}
              </ul>
            </Callout>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
