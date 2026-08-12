# Screen Specification V1.7

## Screen 01 — Onboarding

Goal: get first useful analysis with minimum friction.

Flow:
1. Create workspace
2. Create/select shop
3. Select timezone/currency
4. Upload export
5. Validate
6. Resolve mappings
7. Confirm import
8. Run first analysis
9. Land on Overview

Primary CTA: `Analyze my shop`

## Screen 02 — Overview

Header:
- Shop
- Date range
- Comparison
- Last analyzed timestamp
- Data freshness status

Hero decision block:
- Health score/status
- Most important diagnosis
- impact estimate
- `View why`
- `Fix this first`

KPI strip:
- GMV
- Orders
- Conversion
- AOV
- Traffic

Change indicators:
- absolute
- percentage
- comparison period
- sample warning where applicable

Main sections:
- Priority Insights
- Funnel
- Product movers
- Ads/GMV Max
- Action Plan

## Screen 03 — Insights

Left/filter rail:
- severity
- category
- product
- date
- source

Main:
- diagnosis cards sorted by priority.

Diagnosis card:
- title
- severity
- impact
- confidence
- metric change
- evidence
- recommendation
- `View analysis`

## Screen 04 — Diagnosis Detail

Structure:
1. What happened
2. Why we think it happened
3. Evidence
4. Confounders checked
5. Recommended action
6. Don't touch
7. Monitor
8. Experiment
9. Rule/version metadata

Never show AI prose before deterministic evidence.

## Screen 05 — Products

Table:
- Product
- GMV
- orders
- traffic
- ATC
- CVR
- AOV
- change
- diagnosis

Clicking a row opens product detail.

## Screen 06 — Product Detail

Sections:
- performance summary
- funnel
- trend
- content contribution where available
- ads/GMV Max context
- diagnoses
- recommended experiments

## Screen 07 — Traffic & Funnel

Funnel:
Traffic → PDP views → ATC → Orders → GMV

Each stage:
- current
- previous
- delta
- conversion rate
- sample size

Clicking a stage opens the relevant diagnostic context.

## Screen 08 — Ads & GMV Max

Tabs:
- Paid Ads
- Product GMV Max

GMV Max must display:
- Gross Revenue
- Cost
- ROI
- Cost per Order
- attribution context
- reporting source/version

Do not label GMV Max ROI as ROAS.

## Screen 09 — Data Imports

Import list:
- file
- source
- status
- rows
- date coverage
- validation
- imported at

Import detail:
- validation summary
- mapping
- rejected rows
- warnings
- provenance
- re-run / replace actions

## Screen 10 — Experiments

Experiment list:
- hypothesis
- status
- start
- target metric
- baseline
- result

Experiment detail:
- hypothesis
- control
- variant
- target metric
- success criteria
- result
- next action

## Screen 11 — Reports

Reports:
- executive summary
- diagnosis summary
- product report
- marketing report
- export/share

## Screen 12 — Settings

Sections:
- shop
- users/roles
- data sources
- metric preferences
- notifications
- retention
- billing (future)
