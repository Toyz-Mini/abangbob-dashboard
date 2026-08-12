import type { Config } from 'tailwindcss'

/**
 * Tailwind is bound to the semantic tokens in app/globals.css. Raw palette
 * scales are deliberately not extended: a component that needs a colour must
 * find it in the token set, which is what keeps light and dark consistent
 * (11_DESIGN/DESIGN_TOKENS.md).
 */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('--color-bg'),
        surface: token('--color-surface'),
        raised: token('--color-surface-raised'),
        content: token('--color-text'),
        muted: token('--color-text-muted'),
        line: token('--color-border'),
        accent: token('--color-accent'),
        'accent-contrast': token('--color-accent-contrast'),
        success: token('--color-success'),
        warning: token('--color-warning'),
        danger: token('--color-danger'),
        info: token('--color-info'),
        'success-bg': token('--color-success-bg'),
        'warning-bg': token('--color-warning-bg'),
        'danger-bg': token('--color-danger-bg'),
        'info-bg': token('--color-info-bg'),
        viz: {
          1: token('--viz-1'),
          2: token('--viz-2'),
          3: token('--viz-3'),
          4: token('--viz-4'),
          5: token('--viz-5'),
          grid: token('--viz-grid'),
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      maxWidth: {
        // Canvas width from 11_DESIGN/DASHBOARD_LAYOUT_SPEC.md.
        canvas: '1440px',
      },
      spacing: {
        sidebar: '240px',
        topbar: '56px',
      },
    },
  },
  plugins: [],
} satisfies Config
