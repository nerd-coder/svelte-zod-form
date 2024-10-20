import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type UserConfig } from 'vitest/config'

const config: UserConfig = defineConfig({
  plugins: [sveltekit()],
  test: {
    coverage: {
      include: ['src/lib/**'],
      reporter: ['text', 'html', 'clover', 'json-summary', 'json'],
      thresholds: {
        lines: 60,
        branches: 60,
        functions: 60,
        statements: 60,
      },
    },
    globals: true,
  },
})

export default config
