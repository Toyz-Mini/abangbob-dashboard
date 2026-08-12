/**
 * Screen 05 — Products (11_DESIGN/SCREEN_SPEC.md).
 *
 * The table becomes prioritised cards below the tablet breakpoint rather than a
 * shrunken grid (11_DESIGN/DASHBOARD_LAYOUT_SPEC.md — Mobile).
 */

import Link from 'next/link'
import { AppShell, PageHeader } from '@/components/app-shell'
import { NoAnalysis } from '@/components/no-analysis'
import { Card, CardHeader, Delta, EmptyState, Pill } from '@/components/primitives'
import { formatDateRange, formatMoney, formatNumber, formatPercent } from '@/lib/format'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function ProductsPage() {
  const view = getAnalysisView()
  if (!view) return <NoAnalysis currentPath="/products" />

  const { products, result, shop, current } = view
  const currency = current.currency

  if (products.current.length === 0) {
    return (
      <AppShell currentPath="/products" shopName={shop.name} synthetic={view.synthetic}>
        <PageHeader screenId="Screen 05" title="Products" />
        <EmptyState
          title="No product-grain data"
          reason="Product findings need a product-level export. The imports for this period cover shop totals only, so no product can be compared."
          action={
            <Link
              href="/imports"
              className="inline-block rounded bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
            >
              Import product data
            </Link>
          }
        />
      </AppShell>
    )
  }

  const priorByKey = new Map(products.previous.map((p) => [p.product_key, p]))

  const rows = products.current.map((product) => {
    const prior = priorByKey.get(product.product_key)
    const change = (
      currentValue: number | null,
      priorValue: number | null | undefined,
    ): number | null =>
      currentValue === null || priorValue === null || priorValue === undefined || priorValue === 0
        ? null
        : (currentValue - priorValue) / Math.abs(priorValue)

    const diagnosis = result.diagnoses.find((d) =>
      d.rule_name.endsWith(`— ${product.product_key}`),
    )

    return {
      product,
      gmvChange: change(product.gmv, prior?.gmv ?? null),
      cvrChange: change(product.cvr, prior?.cvr ?? null),
      viewsChange: change(product.product_views, prior?.product_views ?? null),
      diagnosis,
    }
  })

  return (
    <AppShell currentPath="/products" shopName={shop.name} synthetic={view.synthetic}>
      <PageHeader
        screenId="Screen 05"
        title="Products"
        description="Every product with data in both periods, largest GMV first."
        meta={
          <>
            <Pill>{formatDateRange(view.period.start, view.period.end)}</Pill>
            <Pill>{rows.length} products</Pill>
          </>
        }
      />

      {/* Desktop and tablet: full comparison table. */}
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <caption className="sr-only">
              Product performance for the analysis period against the comparison period
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="pb-2 pr-4 font-medium">Product</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">GMV</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">Orders</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">Views</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">ATC rate</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">CVR</th>
                <th scope="col" className="pb-2 pr-4 text-right font-medium">AOV</th>
                <th scope="col" className="pb-2 font-medium">Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, gmvChange, cvrChange, viewsChange, diagnosis }) => (
                <tr key={product.product_key} className="border-b border-line last:border-0">
                  <th scope="row" className="py-3 pr-4 text-left font-normal text-content">
                    {product.product_key}
                  </th>
                  <td className="py-3 pr-4 text-right">
                    <div className="tabular text-content">{formatMoney(product.gmv, currency)}</div>
                    <Delta changePct={gmvChange} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular text-content">
                    {formatNumber(product.orders)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="tabular text-content">
                      {formatNumber(product.product_views)}
                    </div>
                    <Delta changePct={viewsChange} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular text-content">
                    {formatPercent(product.atc_rate, 2)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <div className="tabular text-content">{formatPercent(product.cvr, 2)}</div>
                    <Delta changePct={cvrChange} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular text-content">
                    {formatMoney(product.aov, currency, 2)}
                  </td>
                  <td className="py-3">
                    {diagnosis ? (
                      <Link
                        href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                        className="text-info hover:underline"
                      >
                        {diagnosis.rule_id}
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile: prioritised cards, not a shrunken table. */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ product, gmvChange, cvrChange, viewsChange, diagnosis }) => (
          <li key={product.product_key}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-content">{product.product_key}</span>
                {diagnosis ? (
                  <Link
                    href={`/insights/${encodeURIComponent(diagnosis.rule_id)}`}
                    className="shrink-0 text-xs text-info hover:underline"
                  >
                    {diagnosis.rule_id}
                  </Link>
                ) : null}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs text-muted">GMV</dt>
                  <dd className="tabular text-sm text-content">
                    {formatMoney(product.gmv, currency)}
                  </dd>
                  <Delta changePct={gmvChange} />
                </div>
                <div>
                  <dt className="text-xs text-muted">CVR</dt>
                  <dd className="tabular text-sm text-content">{formatPercent(product.cvr, 2)}</dd>
                  <Delta changePct={cvrChange} />
                </div>
                <div>
                  <dt className="text-xs text-muted">Views</dt>
                  <dd className="tabular text-sm text-content">
                    {formatNumber(product.product_views)}
                  </dd>
                  <Delta changePct={viewsChange} />
                </div>
              </dl>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="mt-6">
        <CardHeader title="How these rates are computed" />
        <p className="text-sm leading-relaxed text-muted">
          Each product&apos;s conversion and add-to-cart rates are recomputed from its own summed
          orders, carts and views across the period. Rates are never averaged across days, and a
          product with no data in the comparison period is shown but not compared.
        </p>
      </Card>
    </AppShell>
  )
}
