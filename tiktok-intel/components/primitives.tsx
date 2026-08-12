/**
 * Reusable primitives.
 *
 * Built before any page composes them (11_DESIGN/DESIGN_TO_CODE_CONTRACT.md
 * rule 4), and documented in 11_DESIGN/COMPONENT_SPEC.md.
 *
 * Colour is never the only status signal: every status carries a label or icon
 * as well (rule 8).
 */

import type { ReactNode } from 'react'
import type { ConfidenceLabel, Severity } from '@/lib/contracts/types'

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'aside'
}) {
  return (
    <Tag
      className={`rounded-lg border border-line bg-raised p-5 ${className}`}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-content">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

const SEVERITY_STYLE: Record<Severity, string> = {
  CRITICAL: 'bg-danger-bg text-danger border-danger/30',
  HIGH: 'bg-danger-bg text-danger border-danger/30',
  MEDIUM: 'bg-warning-bg text-warning border-warning/30',
  LOW: 'bg-info-bg text-info border-info/30',
}

/** Severity always shows its word, never colour alone. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[severity]}`}
    >
      <span aria-hidden="true">{severity === 'LOW' ? '●' : severity === 'MEDIUM' ? '▲' : '■'}</span>
      {severity}
    </span>
  )
}

export function ConfidenceBadge({
  label,
  score,
}: {
  label: ConfidenceLabel
  score?: number
}) {
  const style =
    label === 'HIGH'
      ? 'text-success border-success/30 bg-success-bg'
      : label === 'MEDIUM'
        ? 'text-warning border-warning/30 bg-warning-bg'
        : 'text-muted border-line bg-surface'

  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${style}`}>
      {label} confidence
      {score !== undefined ? <span className="ml-1 tabular opacity-70">{score.toFixed(2)}</span> : null}
    </span>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'info' | 'warning' }) {
  const style =
    tone === 'info'
      ? 'bg-info-bg text-info border-info/30'
      : tone === 'warning'
        ? 'bg-warning-bg text-warning border-warning/30'
        : 'bg-surface text-muted border-line'
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${style}`}>
      {children}
    </span>
  )
}

/**
 * Directional change indicator.
 *
 * `goodDirection` matters: a falling cost is good, a falling conversion rate is
 * not, and the arrow alone cannot say which.
 */
export function Delta({
  changePct,
  goodDirection = 'up',
}: {
  changePct: number | null
  goodDirection?: 'up' | 'down' | 'neutral'
}) {
  if (changePct === null || !Number.isFinite(changePct)) {
    return <span className="text-xs text-muted">no comparison</span>
  }

  const rising = changePct > 0
  const flat = Math.abs(changePct) < 0.001
  const good =
    goodDirection === 'neutral' || flat ? null : goodDirection === 'up' ? rising : !rising

  const tone = good === null ? 'text-muted' : good ? 'text-success' : 'text-danger'
  const arrow = flat ? '→' : rising ? '↑' : '↓'

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium tabular ${tone}`}>
      <span aria-hidden="true">{arrow}</span>
      {`${rising ? '+' : ''}${(changePct * 100).toFixed(1)}%`}
    </span>
  )
}

export function StatTile({
  label,
  value,
  changePct,
  goodDirection = 'up',
  note,
}: {
  label: string
  value: string
  changePct: number | null
  goodDirection?: 'up' | 'down' | 'neutral'
  note?: string
}) {
  return (
    <div className="rounded-lg border border-line bg-raised p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular text-content">{value}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <Delta changePct={changePct} goodDirection={goodDirection} />
        {note ? <span className="text-xs text-muted">{note}</span> : null}
      </div>
    </div>
  )
}

/** Empty state per 11_DESIGN/STATE_SPEC.md: why, what to do, primary action. */
export function EmptyState({
  title,
  reason,
  action,
}: {
  title: string
  reason: string
  action?: ReactNode
}) {
  return (
    <Card className="text-center">
      <h2 className="text-sm font-semibold text-content">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{reason}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}

export function Callout({
  tone,
  title,
  children,
}: {
  tone: 'info' | 'warning' | 'danger' | 'success'
  title: string
  children?: ReactNode
}) {
  const style = {
    info: 'border-info/30 bg-info-bg text-info',
    warning: 'border-warning/30 bg-warning-bg text-warning',
    danger: 'border-danger/30 bg-danger-bg text-danger',
    success: 'border-success/30 bg-success-bg text-success',
  }[tone]

  const icon = { info: 'ℹ', warning: '▲', danger: '■', success: '✓' }[tone]

  return (
    <div className={`rounded-lg border p-4 ${style}`} role={tone === 'danger' ? 'alert' : undefined}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden="true">{icon}</span>
        {title}
      </p>
      {children ? <div className="mt-2 text-sm opacity-90">{children}</div> : null}
    </div>
  )
}

/** Attribution context shown beside any metric whose meaning depends on it. */
export function AttributionNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 border-l-2 border-line pl-3 text-xs leading-relaxed text-muted">
      {children}
    </p>
  )
}

export function DefinitionRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{term}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-content">{children}</dd>
    </div>
  )
}
