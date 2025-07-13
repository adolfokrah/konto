// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import mongoose from 'mongoose'
import { afterAll } from 'vitest'

afterAll(async () => {
  const uri = process.env.DATABASE_URI_TEST || 'mongodb://localhost:27017/payload-test'

  try {
    await mongoose.connect(uri)
    await mongoose.connection.dropDatabase()
    console.log('✅ Dropped test MongoDB database.')
  } catch (err) {
    console.error('❌ Failed to drop test database:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
})
