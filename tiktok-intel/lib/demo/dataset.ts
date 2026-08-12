/**
 * Deterministic synthetic dataset.
 *
 * SYNTHETIC — this is not TikTok data and is never presented as such. The UI
 * labels every screen fed from it (fixtures/README.md, and
 * 11_DESIGN/DESIGN_TO_CODE_CONTRACT.md rule 7: never use fake analytics values
 * in production paths).
 *
 * It exists so the dashboard can be built and reviewed against a real run of
 * the real engine before a certified TikTok export exists. It is reachable only
 * when Supabase is unconfigured or `DEMO_MODE=1` is set.
 */

import type { BusinessEvent } from '../intelligence/confounders'
import type { DailyMetricRow, DailyProductMetricRow } from '../metrics/period'

export const DEMO_SHOP = {
  id: 'demo-shop',
  name: 'Demo Shop (synthetic)',
  currency: 'MYR',
  timezone: 'Asia/Kuala_Lumpur',
}

export const DEMO_PERIOD = { start: '2025-03-15', end: '2025-03-28' }

/** Mulberry32 — small, seeded, and identical on every platform. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dateRange(start: string, days: number): string[] {
  const base = Date.parse(`${start}T00:00:00Z`)
  return Array.from({ length: days }, (_, i) =>
    new Date(base + i * 86_400_000).toISOString().slice(0, 10),
  )
}

interface DayShape {
  traffic: number
  cvr: number
  atcRate: number
  aov: number
  spend: number
  paidRoas: number
  gmvmaxCost: number
  gmvmaxRoi: number
}

/**
 * The story in the data: over the analysis period a new traffic source lifts
 * volume by roughly a quarter while conversion falls, ad spend rises into a
 * weaker return, and one product loses conversion while another loses
 * exposure. That gives the engine several genuine, independently detectable
 * signals rather than one.
 */
const HISTORY_SHAPE: DayShape = {
  traffic: 1_450,
  cvr: 0.081,
  atcRate: 0.121,
  aov: 50,
  spend: 145,
  paidRoas: 4.0,
  gmvmaxCost: 215,
  gmvmaxRoi: 4.1,
}

const CURRENT_SHAPE: DayShape = {
  traffic: 1_820,
  cvr: 0.061,
  atcRate: 0.101,
  aov: 49,
  spend: 182,
  paidRoas: 2.95,
  gmvmaxCost: 340,
  gmvmaxRoi: 3.1,
}

function buildDay(
  businessDate: string,
  shape: DayShape,
  jitter: () => number,
): DailyMetricRow {
  // ±6% day-to-day variation keeps the series realistic without swamping the
  // period-level signals the rules are meant to find.
  const wobble = (magnitude = 0.06) => 1 + (jitter() - 0.5) * 2 * magnitude

  const traffic = Math.round(shape.traffic * wobble())
  const productViews = Math.round(traffic * 0.5 * wobble(0.03))
  const addToCart = Math.round(productViews * shape.atcRate * wobble(0.04))
  const orders = Math.round(productViews * shape.cvr * wobble(0.05))
  const checkout = Math.max(orders, Math.round(addToCart * 0.75 * wobble(0.04)))
  const gmv = Math.round(orders * shape.aov * wobble(0.03))
  const spend = Math.round(shape.spend * wobble(0.08))
  const paidGmv = Math.round(spend * shape.paidRoas * wobble(0.05))
  const gmvmaxCost = Math.round(shape.gmvmaxCost * wobble(0.07))
  const grossRevenue = Math.round(gmvmaxCost * shape.gmvmaxRoi * wobble(0.05))

  return {
    business_date: businessDate,
    currency: DEMO_SHOP.currency,
    traffic,
    product_views: productViews,
    add_to_cart: addToCart,
    checkout,
    orders,
    gmv,
    spend,
    gross_revenue: grossRevenue,
    paid_gmv: paidGmv,
    organic_gmv: Math.max(0, gmv - paidGmv),
    live_gmv: Math.round(gmv * 0.18),
    affiliate_gmv: Math.round(gmv * 0.12),
    gmvmax_cost: gmvmaxCost,
    gmvmax_orders: Math.round(grossRevenue / (shape.aov * 1.1)),
  }
}

export function demoDailyRows(): DailyMetricRow[] {
  const jitter = seededRandom(20250315)
  // History must run right up to the day before the analysis period: the
  // baseline (1–14 Mar) is drawn from these rows, and the anomaly detector
  // reads the 60 days preceding the period.
  const historyDates = dateRange('2025-01-14', 60) // 14 Jan – 14 Mar
  const currentDates = dateRange(DEMO_PERIOD.start, 14) // 15 – 28 Mar

  return [
    ...historyDates.map((date) => buildDay(date, HISTORY_SHAPE, jitter)),
    ...currentDates.map((date) => buildDay(date, CURRENT_SHAPE, jitter)),
  ]
}

const PRODUCTS = [
  { key: 'SKU-1042 · Matte Lip Set', share: 0.34, cvrShift: -0.34, viewShift: 0.05 },
  // Shifts apply on top of the shop-wide decline, so an improving product
  // needs a shift large enough to beat that decline outright. This one is
  // shaped to surface as a PROD-002 exposure opportunity.
  { key: 'SKU-2277 · Hair Serum 60ml', share: 0.24, cvrShift: 0.55, viewShift: -0.45 },
  { key: 'SKU-3310 · Cushion Foundation', share: 0.18, cvrShift: -0.06, viewShift: 0.12 },
  { key: 'SKU-4188 · Cleansing Balm', share: 0.14, cvrShift: 0.03, viewShift: -0.04 },
  { key: 'SKU-5091 · Travel Kit', share: 0.1, cvrShift: -0.11, viewShift: 0.28 },
]

export function demoProductRows(): DailyProductMetricRow[] {
  const jitter = seededRandom(884422)
  const rows: DailyProductMetricRow[] = []

  const emit = (dates: string[], shape: DayShape, applyShift: boolean) => {
    for (const businessDate of dates) {
      for (const product of PRODUCTS) {
        const wobble = 1 + (jitter() - 0.5) * 0.08
        const views = Math.round(
          shape.traffic * 0.5 * product.share * (applyShift ? 1 + product.viewShift : 1) * wobble,
        )
        const cvr = shape.cvr * (applyShift ? 1 + product.cvrShift : 1)
        const orders = Math.max(0, Math.round(views * cvr))
        rows.push({
          product_key: product.key,
          business_date: businessDate,
          currency: DEMO_SHOP.currency,
          product_views: views,
          add_to_cart: Math.round(views * shape.atcRate),
          orders,
          gmv: Math.round(orders * shape.aov),
          spend: null,
        })
      }
    }
  }

  emit(dateRange('2025-03-01', 14), HISTORY_SHAPE, false)
  emit(dateRange(DEMO_PERIOD.start, 14), CURRENT_SHAPE, true)
  return rows
}

export function demoEvents(): BusinessEvent[] {
  return [
    {
      event_type: 'CAMPAIGN',
      name: 'Ramadan push — broad audience test',
      start_at: '2025-03-16T00:00:00Z',
      end_at: '2025-03-26T00:00:00Z',
      scope_json: { channel: 'paid' },
    },
  ]
}

export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === '1') return true
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}
