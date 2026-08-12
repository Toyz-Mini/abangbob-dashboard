# Design System V1.7

## 1. Visual foundation

Default theme: light.
Dark theme: supported from the same semantic tokens.

The interface must not depend on color alone to communicate status.

## 2. Typography

Primary UI typeface:
- Geist Sans or equivalent system-compatible sans-serif.

Numeric/data type:
- Geist Sans with tabular numeric features where available.
- Geist Mono only for IDs, technical values and raw source fields.

Hierarchy:
- Display: 32/40, 700
- Page title: 24/32, 650
- Section title: 18/26, 600
- Card title: 14/20, 600
- Body: 14/22, 400
- Secondary: 13/20, 400
- Caption: 12/18, 400
- Metric value: 28/32, 650
- Dense table: 13/20

Never use huge marketing typography inside the application.

## 3. Spacing

Base unit: 4px.

Allowed spacing tokens:
4, 8, 12, 16, 20, 24, 32, 40, 48.

Avoid arbitrary spacing values.

## 4. Radius

- Small controls: 6px
- Inputs/buttons: 8px
- Cards: 10px
- Large modal: 12px
- Avoid excessive rounded/pill styling.

## 5. Borders and surfaces

Prefer:
- subtle 1px borders
- restrained surface elevation
- no heavy card shadows

Cards should visually group content, not look like floating boxes everywhere.

## 6. Semantic status

Success:
- positive semantic token
- icon + text when important

Warning:
- warning semantic token
- icon + text

Critical:
- critical semantic token
- icon + text

Neutral:
- neutral token

Color must never be the only signal.

## 7. Buttons

Primary:
- one primary action per region.

Secondary:
- supporting actions.

Tertiary:
- low emphasis navigation/actions.

Destructive:
- visually distinct and requires confirmation when irreversible.

## 8. Icons

Use one icon family consistently.
Icons communicate meaning; they do not replace labels for ambiguous actions.

## 9. Motion

Motion is functional, not decorative.

Defaults:
- 100–150ms micro interaction
- 150–250ms panel transition
- avoid long animations
- respect `prefers-reduced-motion`

## 10. Density

Default dashboard density: comfortable/compact hybrid.

Target:
- enough information for an experienced marketer
- enough whitespace for a first-time seller
- no wall of cards
