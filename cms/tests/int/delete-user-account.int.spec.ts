import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { createTestUserData } from '../utils/test-user-helpers'
import { deleteUserAccount } from '../../src/collections/Users/endpoints/delete-user-account'

let payload: Payload

const generateUniqueEmail = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

const generateUniquePhone = () => `+233${Math.floor(Math.random() * 900000000) + 100000000}`

describe('Delete User Account Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload)
  })

  let testUser: any
  let jarCreator: any
  let anotherCollector: any
  let testJar: any

  beforeEach(async () => {
    // Clean up existing data
    const collections = ['jars', 'deletedUserAccounts', 'users']
    for (const collection of collections) {
      const items = await payload.find({
        collection: collection as any,
        where: collection === 'users' ? { email: { not_equals: 'admin@test.com' } } : {},
      })
      for (const item of items.docs) {
        await payload.delete({ collection: collection as any, id: item.id })
      }
    }

    // Create test users
    jarCreator = await payload.create({
      collection: 'users',
      data: createTestUserData({
        email: generateUniqueEmail('jar-creator'),
        password: 'password123',
        fullName: 'Jar Creator User',
        phoneNumber: generateUniquePhone(),
        country: 'gh',
      }),
    })

    testUser = await payload.create({
      collection: 'users',
      data: createTestUserData({
        email: generateUniqueEmail('test-user-to-delete'),
        password: 'password123',
        fullName: 'User To Delete',
        phoneNumber: generateUniquePhone(),
        country: 'gh',
      }),
    })

    anotherCollector = await payload.create({
      collection: 'users',
      data: createTestUserData({
        email: generateUniqueEmail('another-collector'),
        password: 'password123',
        fullName: 'Another Collector',
        phoneNumber: generateUniquePhone(),
        country: 'gh',
      }),
    })

    // Create a test jar with invited collectors including the user to be deleted
    testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Jar with Invitations',
        description: 'A test jar for testing user deletion',
        isActive: true,
        isFixedContribution: false,
        goalAmount: 1000,
        currency: 'GHS',
        creator: jarCreator.id,
        status: 'open',
        invitedCollectors: [
          {
            collector: testUser.id,
            status: 'pending',
          },
          {
            collector: anotherCollector.id,
            status: 'accepted',
          },
        ],
      },
    })
  })

  describe('User Deletion with Jar Cleanup', () => {
    it('should delete user account and remove them from jar invitations', async () => {
      // Verify initial state - jar should have 2 invited collectors
      const initialJar = await payload.findByID({
        collection: 'jars',
        id: testJar.id,
      })
      expect(initialJar.invitedCollectors).toHaveLength(2)

      // Find the user to delete in the invitations
      const userInInvitations = initialJar.invitedCollectors?.find(
        (inv: any) =>
          (typeof inv.collector === 'string' ? inv.collector : inv.collector.id) === testUser.id,
      )
      expect(userInInvitations).toBeDefined()

      // Mock the request object for the delete endpoint
      const mockReq = {
        payload,
        user: testUser,
        data: { reason: 'Testing account deletion' },
      }

      // Call the delete user account endpoint
      const response = await deleteUserAccount(mockReq as any)

      // Parse response
      const responseData = await response.json()
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('User account deleted successfully')

      // Verify user was deleted
      try {
        await payload.findByID({
          collection: 'users',
          id: testUser.id,
        })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        // User should not exist anymore
        expect(error).toBeDefined()
      }

      // Verify deleted user account record was created
      const deletedAccounts = await payload.find({
        collection: 'deletedUserAccounts',
        where: {
          email: { equals: testUser.email },
        },
      })
      expect(deletedAccounts.docs).toHaveLength(1)
      expect(deletedAccounts.docs[0].email).toBe(testUser.email)
      expect(deletedAccounts.docs[0].deletionReason).toBe('Testing account deletion')

      // Verify user was removed from jar invitations
      const updatedJar = await payload.findByID({
        collection: 'jars',
        id: testJar.id,
      })

      expect(updatedJar.invitedCollectors).toHaveLength(1)

      // The remaining collector should be anotherCollector
      const remainingCollector = updatedJar.invitedCollectors?.[0]
      expect(remainingCollector).toBeDefined()

      const remainingCollectorId =
        typeof remainingCollector!.collector === 'string'
          ? remainingCollector!.collector
          : remainingCollector!.collector.id

      expect(remainingCollectorId).toBe(anotherCollector.id)
      expect(remainingCollector!.status).toBe('accepted')
    })

    it('should handle user deletion when user is not in any jar invitations', async () => {
      // Create a user who is not invited to any jars
      const isolatedUser = await payload.create({
        collection: 'users',
        data: createTestUserData({
          email: generateUniqueEmail('isolated-user'),
          password: 'password123',
          fullName: 'Isolated User',
          phoneNumber: generateUniquePhone(),
          country: 'gh',
        }),
      })

      // Mock the request object
      const mockReq = {
        payload,
        user: isolatedUser,
        data: { reason: 'Testing isolated user deletion' },
      }

      // Call the delete user account endpoint
      const response = await deleteUserAccount(mockReq as any)

      const responseData = await response.json()
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify user was deleted
      try {
        await payload.findByID({
          collection: 'users',
          id: isolatedUser.id,
        })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeDefined()
      }

      // Verify jar invitations were not affected (should still have 2)
      const unchangedJar = await payload.findByID({
        collection: 'jars',
        id: testJar.id,
      })
      expect(unchangedJar.invitedCollectors).toHaveLength(2)
    })

    it('should handle multiple jars with the same user invited', async () => {
      // Create another jar with the test user invited
      const secondJar = await payload.create({
        collection: 'jars',
        data: {
          name: 'Second Test Jar',
          description: 'Another test jar',
          isActive: true,
          isFixedContribution: false,
          goalAmount: 500,
          currency: 'GHS',
          creator: jarCreator.id,
          status: 'open',
          invitedCollectors: [
            {
              collector: testUser.id,
              status: 'accepted',
            },
          ],
        },
      })

      // Mock the request object
      const mockReq = {
        payload,
        user: testUser,
        data: { reason: 'Testing multi-jar cleanup' },
      }

      // Call the delete user account endpoint
      const response = await deleteUserAccount(mockReq as any)

      const responseData = await response.json()
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify user was removed from both jars
      const updatedFirstJar = await payload.findByID({
        collection: 'jars',
        id: testJar.id,
      })
      expect(updatedFirstJar.invitedCollectors).toHaveLength(1)

      const firstJarCollector = updatedFirstJar.invitedCollectors?.[0]
      expect(firstJarCollector).toBeDefined()

      const firstJarCollectorId =
        typeof firstJarCollector!.collector === 'string'
          ? firstJarCollector!.collector
          : firstJarCollector!.collector.id

      expect(firstJarCollectorId).toBe(anotherCollector.id)

      const updatedSecondJar = await payload.findByID({
        collection: 'jars',
        id: secondJar.id,
      })
      expect(updatedSecondJar.invitedCollectors).toHaveLength(0)
    })

    it('should handle deletion when jar has empty invitedCollectors array', async () => {
      // Create a jar with no invited collectors
      const emptyJar = await payload.create({
        collection: 'jars',
        data: {
          name: 'Empty Jar',
          description: 'A jar with no invitations',
          isActive: true,
          isFixedContribution: false,
          goalAmount: 200,
          currency: 'GHS',
          creator: jarCreator.id,
          status: 'open',
          invitedCollectors: [],
        },
      })

      const mockReq = {
        payload,
        user: testUser,
        data: { reason: 'Testing with empty jar' },
      }

      const response = await deleteUserAccount(mockReq as any)

      const responseData = await response.json()
      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      // Verify empty jar remains unchanged
      const unchangedEmptyJar = await payload.findByID({
        collection: 'jars',
        id: emptyJar.id,
      })
      expect(unchangedEmptyJar.invitedCollectors).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should return error when user is not authenticated', async () => {
      const mockReq = {
        payload,
        user: null,
        data: { reason: 'Testing unauthenticated deletion' },
      }

      const response = await deleteUserAccount(mockReq as any)

      const responseData = await response.json()
      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Authentication required')
    })

    it('should return error when deletion reason is not provided', async () => {
      const mockReq = {
        payload,
        user: testUser,
        data: {},
      }

      const response = await deleteUserAccount(mockReq as any)

      const responseData = await response.json()
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Reason for deletion is required')
    })

    it('should return error when data is null', async () => {
      const mockReq = {
        payload,
        user: testUser,
        data: null,
      }

      const response = await deleteUserAccount(mockReq as any)

      const responseData = await response.json()
      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Reason for deletion is required')
    })
  })
})
