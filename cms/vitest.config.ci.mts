import react from '@vitejs/plugin-react'

import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Use node environment for CI to avoid jsdom issues
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.unit.spec.ts', 'tests/int/**/*.int.spec.ts'],
    testTimeout: 60000, // ⏱ for individual tests
    hookTimeout: 60000, // ⏱ for beforeEach / afterEach / beforeAll
    poolOptions: {
      forks: {
        singleFork: true, // Force sequential execution
      },
    },
    // OR set maxConcurrency to 1
    maxConcurrency: 1,
    // Global setup for tests that need DOM-like environment
    globals: true,
    // Updated syntax for dependency handling
    server: {
      deps: {
        external: ['webidl-conversions', 'whatwg-url'],
      },
    },
    // Environment variables for CI
    env: {
      NODE_ENV: 'test',
      CI: 'true',
    },
  },
})
