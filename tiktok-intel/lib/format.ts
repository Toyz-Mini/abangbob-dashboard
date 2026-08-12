/** Shared display formatting. Never used to compute a metric. */

export function formatNumber(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toLocaleString('en-MY', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatMoney(value: number | null, currency: string, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${currency} ${value.toLocaleString('en-MY', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

export function formatRatio(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return value.toFixed(digits)
}

/** Signed change, always carrying its sign so direction is unambiguous. */
export function formatChange(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return 'no comparison'
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(digits)}%`
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`
}

export function daysAgo(iso: string): number {
  const then = Date.parse(`${iso}T00:00:00Z`)
  const today = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  return Math.max(0, Math.round((today - then) / 86_400_000))
}
