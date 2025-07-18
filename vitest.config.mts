import react from '@vitejs/plugin-react'

import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    testTimeout: 60000, // ⏱ for individual tests
    hookTimeout: 60000, // ⏱ for beforeEach / afterEach / beforeAll
    poolOptions: {
      forks: {
        singleFork: true, // Force sequential execution
      },
    },
    // OR set maxConcurrency to 1
    maxConcurrency: 1,
  },
})
