import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      thresholds: {
        statements: 93,
        branches: 88,
        functions: 92,
        lines: 93,
      },
    },
  },
})
