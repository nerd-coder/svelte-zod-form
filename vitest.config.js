import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html', 'clover', 'json-summary', 'json'],
      lines: 60,
      branches: 60,
      functions: 60,
      statements: 60,
    },
    globals: true,
  },
})
