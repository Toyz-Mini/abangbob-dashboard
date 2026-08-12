/**
 * Screen 02 — Overview (11_DESIGN/SCREEN_SPEC.md).
 *
 * Layout order from 11_DESIGN/DASHBOARD_LAYOUT_SPEC.md. Above the fold must
 * expose data freshness, the business result, the top problem and the action.
 * Charts are secondary to decisions, so there are none here.
 */

import Link from 'next/link'
import { AppShell, PageHeader } from '@/components/app-shell'
import { DiagnosisCard } from '@/components/diagnosis'
import { NoAnalysis } from '@/components/no-analysis'
import {
  AttributionNote,
  Callout,
  Card,
  CardHeader,
  ConfidenceBadge,
  Delta,
  EmptyState,
  Pill,
  StatTile,
} from '@/components/primitives'
import { formatDateRange, formatMoney, formatNumber, formatPercent, daysAgo } from '@/lib/format'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

const HEALTH_TONE = {
  CRITICAL: 'danger',
  AT_RISK: 'danger',
  FAIR: 'warning',
  GOOD: 'success',
  STRONG: 'success',
} as const

export default function OverviewPage() {
  const view = getAnalysisView()
  if (!view) return <NoAnalysis currentPath="/" />

  const { result, changes, current, previous, shop, products } = view
  const currency = current.currency
  const primary = result.primary
  const freshnessDays = view.data_through ? daysAgo(view.data_through) : null

  const movers = [...products.current]
    .map((product) => {
      const prior = products.previous.find((p) => p.product_key === product.product_key)
      const changePct =
        prior && prior.gmv !== null && prior.gmv > 0 && product.gmv !== null
          ? (product.gmv - prior.gmv) / prior.gmv
          : null
      return { product, changePct }
    })
    .filter((row) => row.changePct !== null)
    .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!))
    .slice(0, 4)

  return (
    <AppShell currentPath="/" shopName={shop.name} synthetic={view.synthetic}>
      <PageHeader
        screenId="Screen 02"
        title="Overview"
        meta={
          <>
            <Pill>{formatDateRange(view.period.start, view.period.end)}</Pill>
            <Pill>vs {formatDateRange(view.baseline.start, view.baseline.end)}</Pill>
            {freshnessDays !== null ? (
              <Pill tone={freshnessDays > 3 ? 'warning' : 'neutral'}>
                Data through {view.data_through}
                {freshnessDays > 0 ? ` · ${freshnessDays}d ago` : ' · today'}
              </Pill>
            ) : null}
          </>
        }
      />

      <div className="space-y-6">
        {view.synthetic ? (
          <Callout tone="warning" title="Synthetic dataset">
            Every figure on this screen is generated test data, not a TikTok export. It exists so the
            interface can be reviewed against a real run of the diagnostic engine before a certified
            export format is registered.
          </Callout>
        ) : null}

        {result.status === 'DATA_INVALID' ? (
          <Callout tone="danger" title="The uploaded data contradicts itself">
            <p>No diagnosis is shown, because any conclusion drawn from this data would be unsound.</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {result.limitations.slice(0, 4).map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </Callout>
        ) : null}

        {/* Hero decision block — health, top problem, action. */}
        <Card className="border-l-4 border-l-accent">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  Shop health
                </span>
                {result.health.score !== null && result.health.label ? (
                  <>
                    <span className="text-2xl font-semibold tabular text-content">
                      {Math.round(result.health.score * 100)}
                    </span>
                    <Pill tone={HEALTH_TONE[result.health.label] === 'success' ? 'neutral' : 'warning'}>
                      {result.health.label.replace('_', ' ')}
                    </Pill>
                    <ConfidenceBadge label={result.health.confidence} />
                  </>
                ) : (
                  <span className="text-sm text-muted">not enough data to score</span>
                )}
              </div>

              {primary ? (
                <>
                  <h2 className="mt-4 text-base font-semibold text-content">
                    {primary.rule_name}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-content">
                    {primary.observation}
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    Estimated impact{' '}
                    <span className="font-medium text-content">
                      {primary.priority.impact_value === null
                        ? 'not measurable from this data'
                        : formatMoney(Math.abs(primary.priority.impact_value), currency)}
                    </span>{' '}
                    over this period.
                  </p>
                </>
              ) : result.status === 'HEALTHY' ? (
                <p className="mt-4 text-sm leading-relaxed text-content">
                  No material issues detected for this period. Nothing crossed a diagnostic
                  threshold, so there is no action to take.
                </p>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  No diagnosis is available for this period.
                </p>
              )}
            </div>

            {primary ? (
              <div className="flex shrink-0 gap-3">
                <Link
                  href={`/insights/${encodeURIComponent(primary.rule_id)}`}
                  className="rounded border border-line px-4 py-2 text-sm font-medium text-content hover:bg-surface"
                >
                  View why
                </Link>
                <Link
                  href={`/insights/${encodeURIComponent(primary.rule_id)}#action`}
                  className="rounded bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
                >
                  Fix this first
                </Link>
              </div>
            ) : null}
          </div>
        </Card>

        {/* KPI strip — horizontally scrollable on small screens. */}
        <div className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
          <div className="grid min-w-[720px] grid-cols-5 gap-4 lg:min-w-0">
            <StatTile
              label="GMV"
              value={formatMoney(current.totals.gmv, currency)}
              changePct={changes.get('gmv').change_pct}
            />
            <StatTile
              label="Orders"
              value={formatNumber(current.totals.orders)}
              changePct={changes.get('orders').change_pct}
            />
            <StatTile
              label="Traffic"
              value={formatNumber(current.totals.traffic)}
              changePct={changes.get('traffic').change_pct}
            />
            <StatTile
              label="Conversion"
              value={formatPercent(current.derived.cvr, 2)}
              changePct={changes.get('cvr').change_pct}
              note={(current.totals.orders ?? 0) < 10 ? 'low sample' : undefined}
            />
            <StatTile
              label="AOV"
              value={formatMoney(current.derived.aov, currency, 2)}
              changePct={changes.get('aov').change_pct}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Priority insights"
              description={`${result.diagnoses.length} finding${result.diagnoses.length === 1 ? '' : 's'}, ordered by priority`}
              action={
                <Link href="/insights" className="text-sm font-medium text-info hover:underline">
                  All insights
                </Link>
              }
            />
            {result.diagnoses.length === 0 ? (
              <p className="text-sm text-muted">
                No material issues detected for this period.
              </p>
            ) : (
              <ol className="space-y-3">
                {result.diagnoses.slice(0, 4).map((diagnosis, index) => (
                  <li key={`${diagnosis.rule_id}-${index}`}>
                    <Link
                      href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                      className="block rounded border border-line p-3 hover:bg-surface"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-content">
                          {diagnosis.rule_name}
                        </span>
                        <span className="shrink-0 text-xs tabular text-muted">
                          {diagnosis.priority.score.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {diagnosis.observation}
                      </p>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Funnel"
              description="Where shoppers are lost between arriving and ordering"
              action={
                <Link href="/funnel" className="text-sm font-medium text-info hover:underline">
                  Detail
                </Link>
              }
            />
            <ul className="space-y-3">
              {[
                { label: 'Traffic', value: current.totals.traffic, change: changes.get('traffic').change_pct },
                { label: 'Product views', value: current.totals.product_views, change: changes.get('product_views').change_pct },
                { label: 'Add to cart', value: current.totals.add_to_cart, change: changes.get('add_to_cart').change_pct },
                { label: 'Checkout', value: current.totals.checkout, change: changes.get('checkout').change_pct },
                { label: 'Orders', value: current.totals.orders, change: changes.get('orders').change_pct },
              ].map((stage) => (
                <li key={stage.label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-content">{stage.label}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm tabular text-content">{formatNumber(stage.value)}</span>
                    <Delta changePct={stage.change} />
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Product movers"
              description="Largest GMV changes against the comparison period"
              action={
                <Link href="/products" className="text-sm font-medium text-info hover:underline">
                  All products
                </Link>
              }
            />
            {movers.length === 0 ? (
              <p className="text-sm text-muted">
                No product-grain data was imported for this period, so movers cannot be identified.
              </p>
            ) : (
              <ul className="space-y-3">
                {movers.map(({ product, changePct }) => (
                  <li key={product.product_key} className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-content">{product.product_key}</span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm tabular text-muted">
                        {formatMoney(product.gmv, currency)}
                      </span>
                      <Delta changePct={changePct} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Ads & GMV Max"
              description="Paid and GMV Max performance, kept separate"
              action={
                <Link href="/ads" className="text-sm font-medium text-info hover:underline">
                  Detail
                </Link>
              }
            />
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Ad spend</dt>
                <dd className="mt-1 text-sm font-semibold tabular text-content">
                  {formatMoney(current.totals.spend, currency)}
                </dd>
                <Delta changePct={changes.get('spend').change_pct} goodDirection="neutral" />
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Paid ROAS</dt>
                <dd className="mt-1 text-sm font-semibold tabular text-content">
                  {current.derived.ad_roi === null ? '—' : `${current.derived.ad_roi.toFixed(2)}×`}
                </dd>
                <Delta changePct={changes.get('ad_roi').change_pct} />
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">GMV Max cost</dt>
                <dd className="mt-1 text-sm font-semibold tabular text-content">
                  {formatMoney(current.totals.gmvmax_cost, currency)}
                </dd>
                <Delta changePct={changes.get('gmvmax_cost').change_pct} goodDirection="neutral" />
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">GMV Max ROI</dt>
                <dd className="mt-1 text-sm font-semibold tabular text-content">
                  {current.derived.gmvmax_roi === null
                    ? '—'
                    : `${current.derived.gmvmax_roi.toFixed(2)}×`}
                </dd>
                <Delta changePct={changes.get('gmvmax_roi').change_pct} />
              </div>
            </dl>
            <AttributionNote>
              GMV Max ROI is TikTok-defined Gross Revenue divided by GMV Max cost. It attributes
              organic and affiliate orders for promoted products while the campaign is active, so it
              is not the same measure as paid ROAS and the two are never compared here.
            </AttributionNote>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Action plan"
            description="The first step for each finding, in priority order"
          />
          {result.diagnoses.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing requires action for this period.
            </p>
          ) : (
            <ol className="space-y-3">
              {result.diagnoses.slice(0, 5).map((diagnosis, index) => {
                const action = diagnosis.recommendations[0]
                if (!action) return null
                return (
                  <li
                    key={`${diagnosis.rule_id}-${index}`}
                    className="flex gap-4 rounded border border-line p-3"
                  >
                    <span className="shrink-0 text-sm font-semibold tabular text-muted">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed text-content">{action.action_text}</p>
                      <p className="mt-1.5 text-xs text-muted">
                        {diagnosis.rule_id} · effort {action.effort} · risk {action.risk}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </Card>

        {result.limitations.length > 0 ? (
          <Card>
            <CardHeader title="What this analysis cannot tell you" />
            <ul className="list-disc space-y-1.5 pl-4 text-sm text-muted">
              {result.limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        {previous.coverage.observed_days === 0 ? (
          <EmptyState
            title="No comparison data"
            reason="The comparison period contains no imported days, so no change can be measured."
          />
        ) : null}
      </div>
    </AppShell>
  )
}
