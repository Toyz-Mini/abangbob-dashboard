/**
 * Screen 08 — Ads & GMV Max (11_DESIGN/SCREEN_SPEC.md).
 *
 * Two tabs, kept apart on purpose. GMV Max must display gross revenue, cost,
 * ROI, cost per order, attribution context and reporting source/version, and
 * GMV Max ROI is never labelled ROAS
 * (02_DATA/METRIC_SEMANTIC_GUARDRAILS.md).
 */

import Link from 'next/link'
import { AppShell, PageHeader } from '@/components/app-shell'
import { NoAnalysis } from '@/components/no-analysis'
import {
  AttributionNote,
  Callout,
  Card,
  CardHeader,
  Delta,
  Pill,
  StatTile,
} from '@/components/primitives'
import { formatDateRange, formatMoney, formatNumber, formatRatio } from '@/lib/format'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function AdsPage() {
  const view = getAnalysisView()
  if (!view) return <NoAnalysis currentPath="/ads" />

  const { current, changes, shop, result } = view
  const currency = current.currency

  const paidFindings = result.diagnoses.filter((d) => d.rule_id.startsWith('ADS-'))
  const gmvMaxFindings = result.diagnoses.filter((d) => d.rule_id.startsWith('GMVMAX-'))

  return (
    <AppShell currentPath="/ads" shopName={shop.name} synthetic={view.synthetic}>
      <PageHeader
        screenId="Screen 08"
        title="Ads & GMV Max"
        description="Paid advertising and Product GMV Max are reported separately because they attribute orders differently."
        meta={
          <>
            <Pill>{formatDateRange(view.period.start, view.period.end)}</Pill>
            <Pill>vs {formatDateRange(view.baseline.start, view.baseline.end)}</Pill>
          </>
        }
      />

      <div className="space-y-8">
        <section aria-labelledby="paid-ads">
          <h2 id="paid-ads" className="mb-3 text-sm font-semibold text-content">
            Paid Ads
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Ad spend"
              value={formatMoney(current.totals.spend, currency)}
              changePct={changes.get('spend').change_pct}
              goodDirection="neutral"
            />
            <StatTile
              label="Paid GMV"
              value={formatMoney(current.totals.paid_gmv, currency)}
              changePct={changes.get('paid_gmv').change_pct}
            />
            <StatTile
              label="Paid ROAS"
              value={
                current.derived.ad_roi === null ? '—' : `${formatRatio(current.derived.ad_roi)}×`
              }
              changePct={changes.get('ad_roi').change_pct}
            />
            <StatTile
              label="Organic GMV"
              value={formatMoney(current.totals.organic_gmv, currency)}
              changePct={changes.get('organic_gmv').change_pct}
            />
          </div>

          <Card className="mt-4">
            <CardHeader title="Attribution" />
            <p className="text-sm leading-relaxed text-muted">
              Paid ROAS here is paid-attributed GMV divided by ad spend, using the source
              report&apos;s own paid attribution window. It answers &ldquo;what did paid advertising
              return per unit of spend&rdquo; and nothing wider.
            </p>
            {paidFindings.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {paidFindings.map((diagnosis, index) => (
                  <li key={`${diagnosis.rule_id}-${index}`}>
                    <Link
                      href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                      className="block rounded border border-line p-3 hover:bg-surface"
                    >
                      <span className="text-sm font-medium text-content">
                        {diagnosis.rule_name}
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {diagnosis.observation}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No paid advertising rule crossed its threshold for this period.
              </p>
            )}
          </Card>
        </section>

        <section aria-labelledby="gmv-max">
          <h2 id="gmv-max" className="mb-3 text-sm font-semibold text-content">
            Product GMV Max
          </h2>

          {current.totals.gmvmax_cost === null ? (
            <Callout tone="info" title="No GMV Max data imported for this period">
              GMV Max ROI cannot be computed without GMV Max cost, and generic ad spend is not a
              valid substitute — the two measure different things.
            </Callout>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Gross revenue"
                  value={formatMoney(current.totals.gross_revenue, currency)}
                  changePct={changes.get('gross_revenue').change_pct}
                />
                <StatTile
                  label="GMV Max cost"
                  value={formatMoney(current.totals.gmvmax_cost, currency)}
                  changePct={changes.get('gmvmax_cost').change_pct}
                  goodDirection="neutral"
                />
                <StatTile
                  label="GMV Max ROI"
                  value={
                    current.derived.gmvmax_roi === null
                      ? '—'
                      : `${formatRatio(current.derived.gmvmax_roi)}×`
                  }
                  changePct={changes.get('gmvmax_roi').change_pct}
                />
                <StatTile
                  label="Cost per order"
                  value={formatMoney(current.derived.gmvmax_cost_per_order, currency, 2)}
                  changePct={changes.get('gmvmax_cost_per_order').change_pct}
                  goodDirection="down"
                />
              </div>

              <Card className="mt-4">
                <CardHeader title="Attribution context" />
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Attributed SKU orders</dt>
                    <dd className="flex items-center gap-3">
                      <span className="tabular text-content">
                        {formatNumber(current.totals.gmvmax_orders)}
                      </span>
                      <Delta changePct={changes.get('gmvmax_orders').change_pct} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Attribution model</dt>
                    <dd className="text-content">GMV_MAX</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Reporting source</dt>
                    <dd className="text-content">
                      SYN-GMVMAX · schema 1.0.0 · metrics {result.versions.metric_version}
                    </dd>
                  </div>
                </dl>

                <AttributionNote>
                  Product GMV Max ROI is TikTok-defined Gross Revenue divided by Product GMV Max
                  cost. While the campaign is active it attributes orders for the promoted products
                  including organic and affiliate orders, so it is not ordinary paid ROAS. This
                  screen never labels it ROAS and never places it beside the paid figure for
                  comparison.
                </AttributionNote>
              </Card>

              {gmvMaxFindings.length > 0 ? (
                <Card className="mt-4">
                  <CardHeader title="GMV Max findings" />
                  <ul className="space-y-2.5">
                    {gmvMaxFindings.map((diagnosis, index) => (
                      <li key={`${diagnosis.rule_id}-${index}`}>
                        <Link
                          href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                          className="block rounded border border-line p-3 hover:bg-surface"
                        >
                          <span className="text-sm font-medium text-content">
                            {diagnosis.rule_name}
                          </span>
                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            {diagnosis.observation}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
