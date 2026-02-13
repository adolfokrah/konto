import payload from 'payload'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

/**
 * Migration script to convert all existing usernames to lowercase
 * Run this once to fix existing data
 */
async function migrateLowercaseUsernames() {
  try {
    console.log('Starting username migration...')

    // Get all users
    const users = await payload.find({
      collection: 'users',
      limit: 10000,
      pagination: false,
    })

    console.log(`Found ${users.docs.length} users to check`)

    let updatedCount = 0

    for (const user of users.docs) {
      if (user.username) {
        const lowercaseUsername = user.username.toLowerCase()

        // Only update if username has uppercase letters
        if (user.username !== lowercaseUsername) {
          try {
            await payload.update({
              collection: 'users',
              id: user.id,
              data: {
                username: lowercaseUsername,
              },
            })
            console.log(`Updated user ${user.id}: ${user.username} -> ${lowercaseUsername}`)
            updatedCount++
          } catch (error: any) {
            console.error(`Failed to update user ${user.id}:`, error.message)
          }
        }
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} usernames to lowercase.`)
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run migration
async function run() {
  const payloadInstance = await getPayloadHMR({ config: configPromise })

  await migrateLowercaseUsernames()

  process.exit(0)
}

run().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
