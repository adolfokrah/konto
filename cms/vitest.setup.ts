// Any setup scripts you might need go here
// Load .env files
import 'dotenv/config'
import { beforeAll } from 'vitest'

// Fix for jsdom environment in CI
beforeAll(() => {
  if (typeof global !== 'undefined' && !global.window) {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    })

    Object.defineProperty(global, 'TextDecoder', {
      value: TextDecoder,
    })
  }
})
