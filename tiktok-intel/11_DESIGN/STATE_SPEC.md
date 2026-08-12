# UI State Specification V1.7

Every screen and component must define:

## Loading
- skeleton for predictable content
- spinner only for short actions
- never show fake values

## Empty
Explain:
1. why empty
2. what user can do
3. primary CTA

## Error
Show:
- what failed
- whether data is affected
- recovery action
- request/reference ID when relevant

## Partial data
Never silently render incomplete analysis.
Show a freshness/coverage warning.

## Stale data
Display:
- last successful import
- analysis timestamp
- stale indicator
- refresh/import CTA

## Permission denied
Explain:
- missing permission
- who can grant it
- safe navigation back

## No diagnosis
Positive state:
`No material issues detected for this period.`

Do not manufacture an insight just to fill the page.

## First-run
Prioritize onboarding and first analysis over empty charts.
