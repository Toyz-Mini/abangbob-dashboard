/** Screen 04 — Diagnosis Detail (11_DESIGN/SCREEN_SPEC.md). */

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell, PageHeader } from '@/components/app-shell'
import { DiagnosisDetail } from '@/components/diagnosis'
import { NoAnalysis } from '@/components/no-analysis'
import { ConfidenceBadge, Pill, SeverityBadge } from '@/components/primitives'
import { formatDateRange } from '@/lib/format'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function DiagnosisDetailPage({ params }: { params: { ruleId: string } }) {
  const view = getAnalysisView()
  if (!view) return <NoAnalysis currentPath="/insights" />

  const ruleId = decodeURIComponent(params.ruleId)
  const diagnosis = view.result.diagnoses.find((d) => d.rule_id === ruleId)
  if (!diagnosis) notFound()

  return (
    <AppShell currentPath="/insights" shopName={view.shop.name} synthetic={view.synthetic}>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/insights" className="text-info hover:underline">
          Insights
        </Link>
        <span className="mx-2 text-muted" aria-hidden="true">
          /
        </span>
        <span className="text-muted">{diagnosis.rule_id}</span>
      </nav>

      <PageHeader
        screenId="Screen 04"
        title={diagnosis.rule_name}
        meta={
          <>
            <SeverityBadge severity={diagnosis.severity} />
            <ConfidenceBadge
              label={diagnosis.confidence.label}
              score={diagnosis.confidence.score}
            />
            <Pill>Priority {diagnosis.priority.score.toFixed(2)}</Pill>
            <Pill>{formatDateRange(view.period.start, view.period.end)}</Pill>
          </>
        }
      />

      <DiagnosisDetail
        diagnosis={diagnosis}
        currency={view.current.currency}
        versions={view.result.versions}
        confounders={view.result.confounders}
      />
    </AppShell>
  )
}
