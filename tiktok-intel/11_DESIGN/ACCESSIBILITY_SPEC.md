# Accessibility Specification V1.7

Baseline:
- WCAG 2.2 AA target
- keyboard accessible
- visible focus
- semantic HTML
- screen-reader labels
- reduced-motion support

## Color
Do not use color alone for:
- severity
- increase/decrease
- success/failure
- status

Use text, icons or patterns as supporting signals.

## Focus
Every interactive element must have a visible focus state.

## Keyboard
Required:
- sidebar navigation
- filters
- tables
- tabs
- drawers
- dialogs
- chart controls
- command/search

## Charts
Every important visualization must have:
- accessible title
- summary
- underlying data/table fallback where appropriate

## Forms
- labels always visible
- errors tied to fields
- clear required/optional status
- no placeholder-only labels

## Touch
Minimum practical touch target: 44x44 CSS px for primary mobile controls.

## Motion
Respect `prefers-reduced-motion`.
