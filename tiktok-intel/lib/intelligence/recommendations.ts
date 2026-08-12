/**
 * Recommendation catalog.
 *
 * One deterministic recommendation set per rule. Recommendations are selected,
 * never generated — the AI layer may rephrase an explanation but may not add,
 * remove or alter an action (CLAUDE.md — non-negotiable rules).
 *
 * Safety constraints from 03_INTELLIGENCE/RECOMMENDATION_ENGINE.md are encoded
 * directly in the action text and effort/risk grades:
 *   - no automatic spend increases;
 *   - no product removal from a single weak metric;
 *   - no aggressive ROI changes from short noisy periods;
 *   - changing several major variables at once must acknowledge confounding.
 */

import type { Recommendation } from '../contracts/types'

const CATALOG: Record<string, Recommendation[]> = {
  'TRAFFIC-001': [
    {
      action_id: 'TRAFFIC-001-A1',
      action_text:
        'Identify which traffic source lost volume before changing anything. Compare video, LIVE, search and affiliate entry points across the two periods, and confirm whether posting cadence or LIVE hours dropped.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['Traffic broken down by entry source for both periods'],
      success_criteria: {
        metric: 'traffic',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 7,
      },
    },
    {
      action_id: 'TRAFFIC-001-A2',
      action_text:
        'Restore the content cadence that was running during the comparison period before adjusting budgets. Do not increase ad spend to compensate for an organic traffic loss until the source of the loss is known.',
      effort: 'MEDIUM',
      risk: 'LOW',
      expected_direction: 'INCREASE',
      prerequisites: ['Confirmed drop in organic posting or LIVE frequency'],
      success_criteria: {
        metric: 'traffic',
        direction: 'INCREASE',
        min_change_pct: 0.15,
        observation_days: 14,
      },
    },
  ],

  'TRAFFIC-002': [
    {
      action_id: 'TRAFFIC-002-A1',
      action_text:
        'Check whether the added traffic is reaching product pages. Compare traffic to product views: if views did not rise with traffic, the problem is entry-point relevance, not the product.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: [],
      success_criteria: {
        metric: 'cvr',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'TRAFFIC-002-A2',
      action_text:
        'Review the audience or placement that produced the extra traffic. Traffic that does not convert is usually mistargeted rather than insufficient — narrow targeting before spending more.',
      effort: 'MEDIUM',
      risk: 'MEDIUM',
      expected_direction: 'INCREASE',
      prerequisites: ['Traffic source breakdown for the current period'],
      success_criteria: {
        metric: 'gmv',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
  ],

  'ATC-001': [
    {
      action_id: 'ATC-001-A1',
      action_text:
        'Audit the product detail pages that carry the most views: price changes, main image, first three lines of description, review count and delivery promise. These are the fields that move add-to-cart.',
      effort: 'MEDIUM',
      risk: 'LOW',
      expected_direction: 'INCREASE',
      prerequisites: ['Product-level view and ATC data for both periods'],
      success_criteria: {
        metric: 'atc_rate',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'ATC-001-A2',
      action_text:
        'Confirm no stock or variant availability change coincided with the decline before treating this as a content problem.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: [],
      success_criteria: {
        metric: 'atc_rate',
        direction: 'INCREASE',
        min_change_pct: 0.05,
        observation_days: 7,
      },
    },
  ],

  'CONV-001': [
    {
      action_id: 'CONV-001-A1',
      action_text:
        'Walk the funnel stage by stage to locate where the loss occurs — views to cart, cart to checkout, checkout to order. Fix the stage that lost the most, not the final number.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['Add-to-cart and checkout counts for both periods'],
      success_criteria: {
        metric: 'cvr',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'CONV-001-A2',
      action_text:
        'Check whether price, shipping cost or promotion eligibility changed between the two periods. A conversion drop that starts on a specific date is usually a settings change, not a gradual content decay.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: 'INCREASE',
      prerequisites: [],
      success_criteria: {
        metric: 'cvr',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
  ],

  'CONV-002': [
    {
      action_id: 'CONV-002-A1',
      action_text:
        'Treat this as a traffic-quality problem first. The shop is receiving more visitors who convert less, which usually means a new source, audience or creative is bringing a different intent level.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['Traffic source breakdown for both periods'],
      success_criteria: {
        metric: 'cvr',
        direction: 'INCREASE',
        min_change_pct: 0.15,
        observation_days: 14,
      },
    },
    {
      action_id: 'CONV-002-A2',
      action_text:
        'Align the landing product with the content that is driving the new traffic. Do not widen targeting further while conversion is falling.',
      effort: 'MEDIUM',
      risk: 'MEDIUM',
      expected_direction: 'INCREASE',
      prerequisites: ['Identified source of the traffic increase'],
      success_criteria: {
        metric: 'cvr',
        direction: 'INCREASE',
        min_change_pct: 0.15,
        observation_days: 14,
      },
    },
  ],

  'AOV-001': [
    {
      action_id: 'AOV-001-A1',
      action_text:
        'Check the product mix before touching prices. A lower average order value is often a shift in which products sell, not a pricing failure.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['Product-level GMV and orders for both periods'],
      success_criteria: {
        metric: 'aov',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'AOV-001-A2',
      action_text:
        'Review active discounts, vouchers and bundle rules that expired or started in this period.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: 'INCREASE',
      prerequisites: [],
      success_criteria: {
        metric: 'aov',
        direction: 'INCREASE',
        min_change_pct: 0.08,
        observation_days: 14,
      },
    },
  ],

  'ADS-001': [
    {
      action_id: 'ADS-001-A1',
      action_text:
        'Hold spend at its current level and find the campaigns carrying the efficiency loss. Increasing budget while return per unit of spend is falling multiplies the loss.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: 'STABILISE',
      prerequisites: ['Campaign-level spend and attributed GMV'],
      success_criteria: {
        metric: 'ad_roi',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'ADS-001-A2',
      action_text:
        'Check creative fatigue and audience overlap on the highest-spend campaigns before changing bids. Change one variable at a time — simultaneous bid, creative and audience changes cannot be attributed afterwards.',
      effort: 'MEDIUM',
      risk: 'MEDIUM',
      expected_direction: 'INCREASE',
      prerequisites: ['Campaign-level delivery data'],
      success_criteria: {
        metric: 'ad_roi',
        direction: 'INCREASE',
        min_change_pct: 0.15,
        observation_days: 14,
      },
    },
  ],

  'ADS-002': [
    {
      action_id: 'ADS-002-A1',
      action_text:
        'Stop further budget increases until attributed revenue responds. Spend has grown materially while paid revenue has not followed.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: 'STABILISE',
      prerequisites: [],
      success_criteria: {
        metric: 'paid_gmv',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'ADS-002-A2',
      action_text:
        'Return the largest-increase campaign to its prior budget for one full observation window and compare. If revenue holds, the additional spend was not productive.',
      effort: 'MEDIUM',
      risk: 'MEDIUM',
      expected_direction: 'STABILISE',
      prerequisites: ['Per-campaign budget history'],
      success_criteria: {
        metric: 'ad_roi',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
  ],

  'GMVMAX-001': [
    {
      action_id: 'GMVMAX-001-A1',
      action_text:
        'Read this as GMV Max ROI, not paid ROAS. Gross revenue is growing while return per unit of cost falls, which is expected behaviour when a campaign scales into broader inventory — decide whether the additional volume is worth the lower ratio.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['GMV Max cost and gross revenue for both periods'],
      success_criteria: {
        metric: 'gmvmax_roi',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
    {
      action_id: 'GMVMAX-001-A2',
      action_text:
        'Check the GMV Max cost-per-order trend alongside ROI. If cost per order is stable, the ratio change is a mix effect rather than an efficiency loss.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['GMV Max attributed SKU orders'],
      success_criteria: {
        metric: 'gmvmax_cost_per_order',
        direction: 'DECREASE',
        min_change_pct: 0.1,
        observation_days: 14,
      },
    },
  ],

  'PROD-001': [
    {
      action_id: 'PROD-001-A1',
      action_text:
        'This product still attracts views but converts materially worse than before. Review its price, main image, reviews and stock state. Do not delist it on this signal alone.',
      effort: 'MEDIUM',
      risk: 'LOW',
      expected_direction: 'INCREASE',
      prerequisites: ['Product detail page state for both periods'],
      success_criteria: {
        metric: 'cvr',
        direction: 'INCREASE',
        min_change_pct: 0.15,
        observation_days: 14,
      },
    },
  ],

  'PROD-002': [
    {
      action_id: 'PROD-002-A1',
      action_text:
        'This product converts better than before but is receiving less exposure. Feature it in upcoming content or LIVE segments before adjusting anything on the listing itself.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: 'INCREASE',
      prerequisites: [],
      success_criteria: {
        metric: 'product_views',
        direction: 'INCREASE',
        min_change_pct: 0.2,
        observation_days: 14,
      },
    },
  ],

  'ANOM-001': [
    {
      action_id: 'ANOM-001-A1',
      action_text:
        'Confirm the outlying day is real before acting. Check for a campaign event, a platform promotion, a stockout, or an incomplete export covering that date.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: ['Daily GMV history covering the flagged date'],
      success_criteria: {
        metric: 'gmv',
        direction: 'INCREASE',
        min_change_pct: 0.1,
        observation_days: 7,
      },
    },
  ],

  'DATA-002': [
    {
      action_id: 'DATA-002-A1',
      action_text:
        'Extend the analysis period or wait for more volume before acting on conversion or product findings. At this sample size, normal variation is indistinguishable from a real change.',
      effort: 'LOW',
      risk: 'LOW',
      expected_direction: null,
      prerequisites: [],
      success_criteria: {
        metric: 'orders',
        direction: 'INCREASE',
        min_change_pct: 0.5,
        observation_days: 14,
      },
    },
  ],
}

export function recommendationsFor(ruleId: string): Recommendation[] {
  return CATALOG[ruleId] ?? []
}

export function hasRecommendations(ruleId: string): boolean {
  return (CATALOG[ruleId]?.length ?? 0) > 0
}
