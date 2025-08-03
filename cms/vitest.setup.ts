// Any setup scripts you might need go here
// Load .env files
import 'dotenv/config'
// import mongoose from 'mongoose'
import { afterAll } from 'vitest'

afterAll(async () => {
  // PayloadCMS handles database connections internally
  // We don't need manual mongoose connection management
  console.log('Tests completed')
})
