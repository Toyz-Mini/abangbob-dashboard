# Dashboard Layout Specification V1.7

## Desktop

Canvas:
- max content width: 1440px
- centered content
- persistent sidebar: 240px target
- top bar: 56px target
- page padding: 24px

Grid:
- 12 columns
- 16px gap
- cards may span 3/4/6/8/12 columns.

## Overview hierarchy

```text
┌──────────────────────────────────────────────────────────────┐
│ Header: Shop | Date | Compare | Freshness                    │
├──────────────────────────────────────────────────────────────┤
│ Health / Priority Diagnosis / Fix First                       │
├────────────┬────────────┬────────────┬────────────┬──────────┤
│ GMV        │ Orders     │ Traffic    │ CVR        │ AOV      │
├──────────────────────────────┬───────────────────────────────┤
│ Priority Insights             │ Funnel                        │
├──────────────────────────────┼───────────────────────────────┤
│ Product Movers                │ Ads / GMV Max                 │
├──────────────────────────────┴───────────────────────────────┤
│ Action Plan                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Rule

Above the fold must expose:
- data freshness
- business result
- top problem
- action.

Charts are secondary to decisions.

## Mobile

Do not merely shrink desktop.

Order:
1. header
2. health
3. priority diagnosis
4. KPI strip horizontal scroll
5. insights
6. funnel
7. products
8. ads
9. action plan

Tables become:
- prioritized cards
- or horizontally scrollable only when comparison requires columns.

Sidebar becomes bottom navigation or drawer.

## Tablet

Use a 2-column content layout.
Keep diagnosis/action blocks prominent.
