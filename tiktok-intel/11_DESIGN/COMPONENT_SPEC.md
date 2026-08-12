# Component Specification V1.7

## App Shell
Props:
- workspace
- shop
- navigation
- user
- freshness

States:
- normal
- loading
- offline
- permission denied

## Metric Card
Displays:
- label
- value
- delta
- comparison period
- optional sparkline
- data freshness

Rules:
- never display a metric without definition/tooltip when ambiguous.

## Diagnosis Card
Required:
- severity
- title
- impact
- confidence
- evidence count
- recommended action
- action CTA

Variants:
- critical
- warning
- opportunity
- monitor
- informational

## Evidence Row
Displays:
- metric
- current
- baseline
- delta
- source
- period

## Chart Card
Required:
- title
- one-line description
- date range
- legend only when necessary
- accessible text summary
- source/version metadata where relevant

## Data Table
Features:
- sortable
- filterable
- column visibility
- cursor pagination
- empty state
- loading state
- error state

## Status Badge
Must communicate status with:
- text
- optional icon
- semantic color

## Filter Bar
Rules:
- visible active filters
- clear all
- URL/shareable state when appropriate
- keyboard accessible

## Drawer / Detail Panel
Use for contextual investigation.
Use full page for long workflows.

## Modal
Use only for:
- confirmation
- focused short forms
- irreversible actions

Do not use modal as the primary detail experience.

## Toast
Use for:
- successful actions
- recoverable background events
- non-blocking errors

Never use toast for critical information that must remain visible.
