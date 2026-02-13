import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

export const checkUsernameUniqueness: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  console.log('🔍 checkUsernameUniqueness hook called')
  console.log('   Operation:', operation)
  console.log('   Username from data:', data?.username)
  console.log('   Original doc username:', originalDoc?.username)

  // Only check uniqueness on create or when username is being changed
  if (operation === 'create' || (operation === 'update' && data?.username)) {
    const username = data?.username

    if (!username || typeof username !== 'string') {
      console.log('   ❌ Username is not a string or is empty')
      return data
    }

    console.log('   📝 Original username:', username)

    // Trim and normalize username to lowercase for case-insensitive check and storage
    const normalizedUsername = username.trim().toLowerCase()
    console.log('   ✨ Normalized username:', normalizedUsername)

    // Always update the username to lowercase in the data
    if (data) {
      data.username = normalizedUsername
      console.log('   ✅ Updated data.username to:', data.username)
    }

    // Prevent username changes after it's been set
    if (operation === 'update' && originalDoc?.username) {
      console.log('   🔒 Checking for username change prevention')
      if (originalDoc.username.toLowerCase() !== normalizedUsername) {
        console.log('   ⛔ Username change detected, blocking')
        throw new APIError('Username cannot be changed once set', 400)
      }
      // Allow case normalization by keeping the lowercase version
      console.log(
        '   ✅ Username unchanged (case-insensitive), saving as lowercase:',
        normalizedUsername,
      )
      return data
    }

    // Check if username already exists (only for create or first-time set)
    console.log('   🔍 Checking for duplicate username:', normalizedUsername)
    const existingUser = await req.payload.find({
      collection: 'users',
      where: {
        username: {
          like: normalizedUsername,
        },
      },
      limit: 1,
    })

    if (existingUser.docs.length > 0) {
      console.log('   ⛔ Duplicate username found!')
      throw new APIError('This username is already in use', 400, [
        {
          field: 'username',
          message: 'This username is already in use',
        },
      ])
    }

    console.log('   ✅ Username is unique and will be saved as:', normalizedUsername)
  }

  console.log('   🏁 Hook completed, returning data')
  return data
}
