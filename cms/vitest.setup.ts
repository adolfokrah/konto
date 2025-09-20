// Any setup scripts you might need go here
// Load .env files
import 'dotenv/config'
// import mongoose from 'mongoose'
import { afterAll, beforeAll } from 'vitest'

// Fix for jsdom environment in CI
beforeAll(() => {
  // Set up global DOM properties that might be missing in CI environments
  if (typeof global !== 'undefined' && !global.window) {
    // Ensure jsdom environment is properly initialized
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    })
    
    Object.defineProperty(global, 'TextDecoder', {
      value: TextDecoder,
    })
  }
})

afterAll(async () => {
  // PayloadCMS handles database connections internally
  // We don't need manual mongoose connection management
})
