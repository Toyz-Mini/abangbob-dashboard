/**
 * Diagnosis presentation.
 *
 * Structure follows 11_DESIGN/SCREEN_SPEC.md Screen 03 (cards) and Screen 04
 * (detail): what happened → why we think it happened → evidence → confounders
 * checked → recommended action → don't touch → monitor → experiment →
 * rule/version metadata.
 *
 * Deterministic evidence always precedes any narrative. There is no AI prose
 * on this surface.
 */

import Link from 'next/link'
import type { Diagnosis, EvidenceItem } from '@/lib/contracts/types'
import { METRIC_LABELS, METRIC_REGISTRY, type CanonicalMetric } from '@/lib/metrics/registry'
import { formatChange, formatMoney, formatNumber, formatPercent, formatRatio } from '@/lib/format'
import {
  AttributionNote,
  Card,
  ConfidenceBadge,
  DefinitionRow,
  Pill,
  SeverityBadge,
} from './primitives'

/** Formats a value the way its own metric definition says it should read. */
export function formatMetricValue(
  metric: string,
  value: number | null,
  currency: string,
): string {
  if (value === null) return '—'
  const definition = METRIC_REGISTRY[metric as CanonicalMetric]
  if (!definition) return formatNumber(value)

  switch (definition.unit) {
    case 'CURRENCY':
      return formatMoney(value, currency, value < 100 ? 2 : 0)
    case 'RATIO':
      // ROI-style ratios read as multiples; funnel rates read as percentages.
      return metric === 'ad_roi' || metric === 'gmvmax_roi'
        ? `${formatRatio(value)}×`
        : formatPercent(value, 2)
    default:
      return formatNumber(value)
  }
}

export function metricLabel(metric: string): string {
  return METRIC_LABELS[metric as CanonicalMetric] ?? metric
}

export function EvidenceTable({
  evidence,
  currency,
}: {
  evidence: EvidenceItem[]
  currency: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">
          Measured values behind this diagnosis, with the threshold each was compared against
        </caption>
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="pb-2 pr-4 font-medium">Metric</th>
            <th scope="col" className="pb-2 pr-4 text-right font-medium">This period</th>
            <th scope="col" className="pb-2 pr-4 text-right font-medium">Comparison</th>
            <th scope="col" className="pb-2 pr-4 text-right font-medium">Change</th>
            <th scope="col" className="pb-2 text-right font-medium">Threshold</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item, index) => (
            <tr key={`${item.metric_name}-${index}`} className="border-b border-line last:border-0">
              <th scope="row" className="py-2.5 pr-4 text-left font-normal text-content">
                {metricLabel(item.metric_name)}
                {item.attribution !== 'SHOP_TOTAL' ? (
                  <span className="ml-2 text-xs text-muted">{item.attribution}</span>
                ) : null}
              </th>
              <td className="py-2.5 pr-4 text-right tabular text-content">
                {formatMetricValue(item.metric_name, item.current_value, currency)}
              </td>
              <td className="py-2.5 pr-4 text-right tabular text-muted">
                {formatMetricValue(item.metric_name, item.baseline_value, currency)}
              </td>
              <td className="py-2.5 pr-4 text-right tabular text-content">
                {formatChange(item.change_pct)}
              </td>
              <td className="py-2.5 text-right tabular text-muted">
                {item.threshold === null
                  ? '—'
                  : Math.abs(item.threshold) <= 1 && item.threshold !== 0
                    ? formatChange(item.threshold)
                    : formatNumber(item.threshold)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DiagnosisCard({
  diagnosis,
  currency,
  rank,
}: {
  diagnosis: Diagnosis
  currency: string
  rank?: number
}) {
  const impact = diagnosis.priority.impact_value

  return (
    <Card as="article" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {rank !== undefined ? (
              <span className="text-xs font-semibold text-muted">#{rank}</span>
            ) : null}
            <h3 className="text-sm font-semibold text-content">{diagnosis.rule_name}</h3>
            <span className="text-xs text-muted">{diagnosis.rule_id}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-content">{diagnosis.observation}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <SeverityBadge severity={diagnosis.severity} />
          <ConfidenceBadge label={diagnosis.confidence.label} score={diagnosis.confidence.score} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Priority</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular text-content">
            {diagnosis.priority.score.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Estimated impact</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular text-content">
            {impact === null ? 'not measurable' : formatMoney(Math.abs(impact), currency)}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-xs uppercase tracking-wide text-muted">Evidence</dt>
          <dd className="mt-0.5 text-sm text-content">{diagnosis.evidence.length} measured metrics</dd>
        </div>
      </dl>

      <p className="text-sm leading-relaxed text-muted">{diagnosis.diagnosis}</p>

      {diagnosis.recommendations[0] ? (
        <div className="rounded border border-line bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Do this first</p>
          <p className="mt-1.5 text-sm leading-relaxed text-content">
            {diagnosis.recommendations[0].action_text}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
          className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast hover:opacity-90"
        >
          View why
        </Link>
        <Link
          href={`/insights/${encodeURIComponent(diagnosis.rule_id)}#action`}
          className="rounded border border-line px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
        >
          Fix this first
        </Link>
      </div>
    </Card>
  )
}

export function DiagnosisDetail({
  diagnosis,
  currency,
  versions,
  confounders,
}: {
  diagnosis: Diagnosis
  currency: string
  versions: { metric_version: string; rule_set_version: string; diagnostic_engine_version: string }
  confounders: Array<{ id: string; detected: boolean; reason: string; evaluated: boolean }>
}) {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-sm font-semibold text-content">1 · What happened</h2>
        <p className="mt-2 text-sm leading-relaxed text-content">{diagnosis.observation}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-content">2 · Why we think it happened</h2>
        <p className="mt-2 text-sm leading-relaxed text-content">{diagnosis.diagnosis}</p>
        <div className="mt-4 rounded border border-line bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Hypothesis — not yet verified
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-content">{diagnosis.hypothesis}</p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-content">3 · Evidence</h2>
        <EvidenceTable evidence={diagnosis.evidence} currency={currency} />
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-content">4 · Confounders checked</h2>
        <ul className="mt-3 space-y-2.5">
          {confounders.map((confounder) => (
            <li key={confounder.id} className="flex gap-3 text-sm">
              <span aria-hidden="true" className="mt-0.5">
                {confounder.detected ? '▲' : confounder.evaluated ? '✓' : '?'}
              </span>
              <span>
                <span className="font-medium text-content">{confounder.id}</span>
                <span className="ml-2 text-muted">
                  {confounder.detected
                    ? confounder.reason
                    : confounder.evaluated
                      ? 'checked, not detected'
                      : 'could not be checked with the available data'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 id="action" className="mb-3 text-sm font-semibold text-content">
          5 · Recommended action
        </h2>
        <ol className="space-y-4">
          {diagnosis.recommendations.map((recommendation, index) => (
            <li key={recommendation.action_id} className="rounded border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted">Step {index + 1}</span>
                <Pill>Effort {recommendation.effort}</Pill>
                <Pill tone={recommendation.risk === 'LOW' ? 'neutral' : 'warning'}>
                  Risk {recommendation.risk}
                </Pill>
                <span className="text-xs text-muted">{recommendation.action_id}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-content">
                {recommendation.action_text}
              </p>
              {recommendation.prerequisites.length > 0 ? (
                <p className="mt-2 text-xs text-muted">
                  Needs first: {recommendation.prerequisites.join('; ')}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted">
                Success looks like {metricLabel(recommendation.success_criteria.metric)}{' '}
                {recommendation.success_criteria.direction === 'INCREASE' ? 'up' : 'down'} at least{' '}
                {(recommendation.success_criteria.min_change_pct * 100).toFixed(0)}% over{' '}
                {recommendation.success_criteria.observation_days} days.
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <Card className="border-warning/30 bg-warning-bg">
        <h2 className="text-sm font-semibold text-warning">6 · Don&apos;t touch yet</h2>
        <p className="mt-2 text-sm leading-relaxed text-warning">{diagnosis.dont_touch}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-content">7 · Monitor</h2>
        <p className="mt-2 text-sm text-muted">{diagnosis.monitor.note}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {diagnosis.monitor.metrics.map((metric) => (
            <Pill key={metric} tone="info">
              {metricLabel(metric)}
            </Pill>
          ))}
          <Pill>{diagnosis.monitor.window_days} days</Pill>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-content">8 · Test it before you trust it</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The hypothesis above is a candidate explanation, not a proven cause. Run one change at a
          time against the success criteria so the result can be attributed.
        </p>
        <Link
          href="/experiments"
          className="mt-3 inline-block rounded border border-line px-3 py-1.5 text-sm font-medium text-content hover:bg-surface"
        >
          Plan an experiment
        </Link>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-content">9 · Rule and version metadata</h2>
        <dl>
          <DefinitionRow term="Rule">
            {diagnosis.rule_id} — {diagnosis.rule_name}
          </DefinitionRow>
          <DefinitionRow term="Confidence">
            {diagnosis.confidence.score.toFixed(3)} ({diagnosis.confidence.label}) — data
            completeness {diagnosis.confidence.components.data_completeness.toFixed(2)}, signal
            strength {diagnosis.confidence.components.signal_strength.toFixed(2)}, cross-signal
            agreement {diagnosis.confidence.components.cross_signal_agreement.toFixed(2)}, sample
            sufficiency {diagnosis.confidence.components.sample_sufficiency.toFixed(2)}
          </DefinitionRow>
          <DefinitionRow term="Priority">
            {diagnosis.priority.score.toFixed(3)} — severity{' '}
            {diagnosis.priority.components.severity_weight.toFixed(2)}, impact{' '}
            {diagnosis.priority.components.impact.toFixed(2)}, confidence{' '}
            {diagnosis.priority.components.confidence.toFixed(2)}
          </DefinitionRow>
          <DefinitionRow term="Versions">
            metrics {versions.metric_version} · rules {versions.rule_set_version} · engine{' '}
            {versions.diagnostic_engine_version}
          </DefinitionRow>
          <DefinitionRow term="Limitations">
            <ul className="list-disc space-y-1 pl-4">
              {diagnosis.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </DefinitionRow>
        </dl>
        <AttributionNote>
          Confidence measures the quality of the evidence, not the probability that the hypothesis
          is causally true.
        </AttributionNote>
      </Card>
    </div>
  )
}
