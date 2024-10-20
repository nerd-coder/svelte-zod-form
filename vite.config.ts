import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig, type ViteUserConfig } from 'vitest/config'
import { svelteTesting } from '@testing-library/svelte/vite'

const config: ViteUserConfig = defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  test: {
    environment: 'jsdom',
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
