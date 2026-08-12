import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  // The engine suite is pure TypeScript; loading a PostCSS pipeline would only
  // pull Tailwind into a Node test run. Pointing at an empty plugin list also
  // stops Vite walking up into the parent repository's postcss.config.js.
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
