/**
 * Screen 07 — Traffic & Funnel (11_DESIGN/SCREEN_SPEC.md).
 *
 * Each stage shows current, previous, delta, conversion rate and sample size.
 */

import Link from 'next/link'
import { AppShell, PageHeader } from '@/components/app-shell'
import { NoAnalysis } from '@/components/no-analysis'
import { Callout, Card, CardHeader, Delta, Pill } from '@/components/primitives'
import { formatDateRange, formatNumber, formatPercent } from '@/lib/format'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function FunnelPage() {
  const view = getAnalysisView()
  if (!view) return <NoAnalysis currentPath="/funnel" />

  const { current, previous, changes, shop, result } = view

  const stages = [
    {
      key: 'traffic',
      label: 'Traffic',
      current: current.totals.traffic,
      previous: previous.totals.traffic,
      change: changes.get('traffic').change_pct,
      rateLabel: null as string | null,
      rate: null as number | null,
      rateChange: null as number | null,
    },
    {
      key: 'product_views',
      label: 'Product views',
      current: current.totals.product_views,
      previous: previous.totals.product_views,
      change: changes.get('product_views').change_pct,
      rateLabel: 'Views per visit',
      rate:
        current.totals.product_views !== null && (current.totals.traffic ?? 0) > 0
          ? current.totals.product_views / current.totals.traffic!
          : null,
      rateChange: null,
    },
    {
      key: 'add_to_cart',
      label: 'Add to cart',
      current: current.totals.add_to_cart,
      previous: previous.totals.add_to_cart,
      change: changes.get('add_to_cart').change_pct,
      rateLabel: 'Add-to-cart rate',
      rate: current.derived.atc_rate,
      rateChange: changes.get('atc_rate').change_pct,
    },
    {
      key: 'checkout',
      label: 'Checkout',
      current: current.totals.checkout,
      previous: previous.totals.checkout,
      change: changes.get('checkout').change_pct,
      rateLabel: 'Cart to checkout',
      rate: current.derived.checkout_rate,
      rateChange: changes.get('checkout_rate').change_pct,
    },
    {
      key: 'orders',
      label: 'Orders',
      current: current.totals.orders,
      previous: previous.totals.orders,
      change: changes.get('orders').change_pct,
      rateLabel: 'Conversion rate',
      rate: current.derived.cvr,
      rateChange: changes.get('cvr').change_pct,
    },
  ]

  const top = stages[0]!.current ?? 0
  const lowSample = (current.totals.orders ?? 0) < 10 || (current.totals.product_views ?? 0) < 100

  const relatedRules = result.diagnoses.filter((d) =>
    ['TRAFFIC', 'ATC', 'CONV', 'AOV'].some((family) => d.rule_id.startsWith(family)),
  )

  return (
    <AppShell currentPath="/funnel" shopName={shop.name} synthetic={view.synthetic}>
      <PageHeader
        screenId="Screen 07"
        title="Traffic & Funnel"
        description="Traffic → product views → add to cart → checkout → orders. Each stage shows what it received, what it passed on, and at what rate."
        meta={
          <>
            <Pill>{formatDateRange(view.period.start, view.period.end)}</Pill>
            <Pill>vs {formatDateRange(view.baseline.start, view.baseline.end)}</Pill>
          </>
        }
      />

      <div className="space-y-6">
        {lowSample ? (
          <Callout tone="warning" title="Small sample">
            This period has {formatNumber(current.totals.orders)} orders across{' '}
            {formatNumber(current.totals.product_views)} product views. Below 10 orders or 100 views,
            ordinary variation is indistinguishable from a real change.
          </Callout>
        ) : null}

        <Card>
          <CardHeader
            title="Funnel"
            description="Bar width is each stage as a share of traffic"
          />
          <ol className="space-y-5">
            {stages.map((stage) => {
              const share = top > 0 && stage.current !== null ? stage.current / top : 0
              return (
                <li key={stage.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-content">{stage.label}</span>
                    <span className="flex items-center gap-3 text-sm">
                      <span className="tabular text-content">{formatNumber(stage.current)}</span>
                      <span className="tabular text-muted">
                        from {formatNumber(stage.previous)}
                      </span>
                      <Delta changePct={stage.change} />
                    </span>
                  </div>

                  <div
                    className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface"
                    role="img"
                    aria-label={`${stage.label}: ${formatPercent(share, 1)} of traffic`}
                  >
                    <div
                      className="h-full rounded-full bg-viz-1"
                      style={{ width: `${Math.max(share * 100, 0.5)}%` }}
                    />
                  </div>

                  {stage.rateLabel ? (
                    <p className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                      <span>
                        {stage.rateLabel}{' '}
                        <span className="tabular text-content">
                          {stage.rateLabel === 'Views per visit'
                            ? stage.rate === null
                              ? '—'
                              : stage.rate.toFixed(2)
                            : formatPercent(stage.rate, 2)}
                        </span>
                      </span>
                      {stage.rateChange !== null ? <Delta changePct={stage.rateChange} /> : null}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </Card>

        <Card>
          <CardHeader
            title="Findings from this funnel"
            description="Diagnoses whose evidence sits in the traffic or conversion path"
          />
          {relatedRules.length === 0 ? (
            <p className="text-sm text-muted">
              No traffic or conversion rule crossed its threshold for this period.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {relatedRules.map((diagnosis, index) => (
                <li key={`${diagnosis.rule_id}-${index}`}>
                  <Link
                    href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                    className="block rounded border border-line p-3 hover:bg-surface"
                  >
                    <span className="text-sm font-medium text-content">{diagnosis.rule_name}</span>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {diagnosis.observation}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="How conversion rate is defined here" />
          <p className="text-sm leading-relaxed text-muted">
            Conversion rate is orders divided by product views over the whole period, recomputed
            from the summed components rather than averaged across days. Averaging daily rates
            would weight a quiet Tuesday the same as a peak Saturday.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}
