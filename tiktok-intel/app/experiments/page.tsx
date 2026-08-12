/** Screen 10 — Experiments (11_DESIGN/SCREEN_SPEC.md). */

import Link from 'next/link'
import { AppShell, PageHeader } from '@/components/app-shell'
import { Card, CardHeader, EmptyState, Pill } from '@/components/primitives'
import { metricLabel } from '@/components/diagnosis'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function ExperimentsPage() {
  const view = getAnalysisView()

  const candidates =
    view?.result.diagnoses.flatMap((diagnosis) =>
      diagnosis.recommendations.map((recommendation) => ({ diagnosis, recommendation })),
    ) ?? []

  return (
    <AppShell
      currentPath="/experiments"
      shopName={view?.shop.name ?? 'No shop selected'}
      synthetic={view?.synthetic ?? false}
    >
      <PageHeader
        screenId="Screen 10"
        title="Experiments"
        description="A recommendation is a hypothesis until it is tested. Each experiment fixes one change, one target metric and one success threshold in advance."
      />

      <div className="space-y-6">
        <EmptyState
          title="No experiments running"
          reason="Nothing has been planned yet. Start from a diagnosis so the experiment inherits its hypothesis, target metric and success criteria instead of being written from scratch."
          action={
            <Link
              href="/insights"
              className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
            >
              Browse insights
            </Link>
          }
        />

        {candidates.length > 0 ? (
          <Card>
            <CardHeader
              title="Ready to test"
              description="Success criteria come from the rule that produced each recommendation"
            />
            <ul className="space-y-3">
              {candidates.slice(0, 6).map(({ diagnosis, recommendation }) => (
                <li key={recommendation.action_id} className="rounded border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                      className="text-sm font-medium text-info hover:underline"
                    >
                      {diagnosis.rule_id}
                    </Link>
                    <Pill>Effort {recommendation.effort}</Pill>
                    <Pill tone={recommendation.risk === 'LOW' ? 'neutral' : 'warning'}>
                      Risk {recommendation.risk}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-content">
                    {recommendation.action_text}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Target {metricLabel(recommendation.success_criteria.metric)} ·{' '}
                    {recommendation.success_criteria.direction === 'INCREASE' ? 'increase' : 'decrease'}{' '}
                    at least {(recommendation.success_criteria.min_change_pct * 100).toFixed(0)}% ·
                    observe {recommendation.success_criteria.observation_days} days
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card>
          <CardHeader title="Why one change at a time" />
          <p className="text-sm leading-relaxed text-muted">
            Changing price, creative and targeting in the same week makes the result
            uninterpretable: whatever happens, there is no way to say which change caused it. The
            engine will not claim causation from an observational comparison, and neither should a
            test that mixes its variables.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
