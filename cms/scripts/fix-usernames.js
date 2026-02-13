// Quick script to lowercase all usernames
// Run with: node scripts/fix-usernames.js

const payload = require('payload')
require('dotenv').config()

async function fixUsernames() {
  try {
    // Initialize Payload
    await payload.init({
      secret: process.env.PAYLOAD_SECRET,
      mongoURL: process.env.DATABASE_URI,
      local: true,
    })

    console.log('✅ Payload initialized')

    // Get all users
    const users = await payload.find({
      collection: 'users',
      limit: 1000,
    })

    console.log(`📊 Found ${users.docs.length} users`)

    let updated = 0

    for (const user of users.docs) {
      if (user.username) {
        const lowercase = user.username.toLowerCase()

        if (user.username !== lowercase) {
          console.log(`🔄 Updating: ${user.username} → ${lowercase}`)

          // Use findByID and update to bypass uniqueness check temporarily
          await payload.db.collections.users.findOneAndUpdate(
            { _id: user.id },
            { $set: { username: lowercase } },
          )

          updated++
        }
      }
    }

    console.log(`\n✅ Done! Updated ${updated} usernames`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixUsernames()
