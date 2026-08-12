# Design Tokens V1.7

Use semantic CSS variables. Components must consume semantic tokens, not raw hex values.

```css
:root {
  --color-bg: 255 255 255;
  --color-surface: 250 250 250;
  --color-surface-raised: 255 255 255;
  --color-text: 17 24 39;
  --color-text-muted: 107 114 128;
  --color-border: 229 231 235;

  --color-accent: 17 24 39;

  --color-success: 22 101 52;
  --color-warning: 146 64 14;
  --color-danger: 185 28 28;
  --color-info: 30 64 175;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

The exact palette may be tuned during visual QA, but semantic names are mandatory.

## Data visualization tokens

Use a dedicated visualization scale separate from UI status colors.

Rules:
- do not reuse one color for unrelated variables;
- use direct labels where practical;
- patterns/icons/text accompany critical states;
- maximum 5 categorical series before switching to a different visualization or interaction.

## Dark mode

All semantic tokens must have dark-mode equivalents.
Do not simply invert colors.

## Token rule

No component may introduce a one-off arbitrary color for a normal UI state.
