import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '@/payload.config'
import { clearAllCollections } from 'tests/utils/testCleanup'

let payload: Payload

const generateUniqueEmail = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

describe('Users Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload) // Clear collections before tests
  })

  beforeEach(async () => {
    // Clean up users before each test (except admin users)
    const users = await payload.find({
      collection: 'users',
      where: {
        email: {
          not_equals: 'admin@test.com',
        },
      },
    })

    for (const user of users.docs) {
      await payload.delete({
        collection: 'users',
        id: user.id,
      })
    }
  })

  describe('User Creation', () => {
    it('should create a user with required fields', async () => {
      const userData = {
        email: generateUniqueEmail('test'),
        password: 'testPassword123',
        fullName: 'John Doe',
        phoneNumber: '+233541234567',
        country: 'gh' as const,
      }

      const user = await payload.create({
        collection: 'users',
        data: userData,
      })

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.fullName).toBe(userData.fullName)
      expect(user.phoneNumber).toBe(userData.phoneNumber)
      expect(user.country).toBe(userData.country)
      expect(user.isKYCVerified).toBe(false) // Default value
    })

    it('should create a user with complete app settings', async () => {
      const userData = {
        email: 'user2@example.com',
        password: 'testPassword123',
        fullName: 'Jane Smith',
        phoneNumber: '+234801234567',
        country: 'ng' as const,
        isKYCVerified: true,
        appSettings: {
          language: 'fr' as const,
          darkMode: true,
          biometricAuthEnabled: true,
          notificationsSettings: {
            pushNotificationsEnabled: false,
            emailNotificationsEnabled: true,
            smsNotificationsEnabled: true,
          },
        },
      }

      const user = await payload.create({
        collection: 'users',
        data: userData,
      })

      expect(user).toBeDefined()
      expect(user.isKYCVerified).toBe(true)
      expect(user.appSettings?.language).toBe('fr')
      expect(user.appSettings?.darkMode).toBe(true)
      expect(user.appSettings?.biometricAuthEnabled).toBe(true)
      expect(user.appSettings?.notificationsSettings?.pushNotificationsEnabled).toBe(false)
      expect(user.appSettings?.notificationsSettings?.emailNotificationsEnabled).toBe(true)
      expect(user.appSettings?.notificationsSettings?.smsNotificationsEnabled).toBe(true)
    })

    it('should fail to create user without required fields', async () => {
      const incompleteUserData = {
        email: 'incomplete@example.com',
        password: 'testPassword123',
        // Missing fullName, phoneNumber, country
      } as any

      await expect(
        payload.create({
          collection: 'users',
          data: incompleteUserData,
        }),
      ).rejects.toThrow()
    })

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        email: generateUniqueEmail('duplicate'),
        password: 'testPassword123',
        fullName: 'First User',
        phoneNumber: '+233541234567',
        country: 'gh' as const,
      }

      // Create first user
      await payload.create({
        collection: 'users',
        data: userData,
      })

      // Try to create second user with same email
      const duplicateUserData = {
        ...userData,
        fullName: 'Second User',
      }

      await expect(
        payload.create({
          collection: 'users',
          data: duplicateUserData,
        }),
      ).rejects.toThrow()
    })
  })

  describe('User Retrieval', () => {
    beforeEach(async () => {
      // Create test users for retrieval tests
      const users = [
        {
          email: 'user1@example.com',
          password: 'password123',
          fullName: 'Alice Johnson',
          phoneNumber: '+233541111111',
          country: 'gh' as const,
          isKYCVerified: true,
        },
        {
          email: 'user2@example.com',
          password: 'password123',
          fullName: 'Bob Wilson',
          phoneNumber: '+234802222222',
          country: 'ng' as const,
          isKYCVerified: false,
        },
        {
          email: 'user3@example.com',
          password: 'password123',
          fullName: 'Charlie Brown',
          phoneNumber: '+233543333333',
          country: 'gh' as const,
          isKYCVerified: true,
        },
      ]

      for (const userData of users) {
        await payload.create({
          collection: 'users',
          data: userData,
        })
      }
    })

    it('should find all users', async () => {
      const result = await payload.find({
        collection: 'users',
      })

      expect(result.docs).toHaveLength(3)
      expect(result.totalDocs).toBe(3)
    })

    it('should find users by country', async () => {
      const ghanaUsers = await payload.find({
        collection: 'users',
        where: {
          country: {
            equals: 'gh',
          },
        },
      })

      expect(ghanaUsers.docs).toHaveLength(2)
      ghanaUsers.docs.forEach(user => {
        expect(user.country).toBe('gh')
      })
    })

    it('should find KYC verified users', async () => {
      const verifiedUsers = await payload.find({
        collection: 'users',
        where: {
          isKYCVerified: {
            equals: true,
          },
        },
      })

      expect(verifiedUsers.docs).toHaveLength(2)
      verifiedUsers.docs.forEach(user => {
        expect(user.isKYCVerified).toBe(true)
      })
    })

    it('should find user by ID', async () => {
      const allUsers = await payload.find({
        collection: 'users',
      })
      const firstUser = allUsers.docs[0]

      const foundUser = await payload.findByID({
        collection: 'users',
        id: firstUser.id,
      })

      expect(foundUser).toBeDefined()
      expect(foundUser.id).toBe(firstUser.id)
      expect(foundUser.email).toBe(firstUser.email)
    })

    it('should search users by full name', async () => {
      const searchResult = await payload.find({
        collection: 'users',
        where: {
          fullName: {
            contains: 'Alice',
          },
        },
      })

      expect(searchResult.docs).toHaveLength(1)
      expect(searchResult.docs[0].fullName).toBe('Alice Johnson')
    })
  })

  describe('User Updates', () => {
    let testUser: any

    beforeEach(async () => {
      // Create a test user for update tests
      testUser = await payload.create({
        collection: 'users',
        data: {
          email: 'update@example.com',
          password: 'password123',
          fullName: 'Update Test User',
          phoneNumber: '+233541234567',
          country: 'gh' as const,
          isKYCVerified: false,
        },
      })
    })

    it('should update user KYC status', async () => {
      const updatedUser = await payload.update({
        collection: 'users',
        id: testUser.id,
        data: {
          isKYCVerified: true,
        },
      })

      expect(updatedUser.isKYCVerified).toBe(true)
    })

    it('should update user app settings', async () => {
      const updatedUser = await payload.update({
        collection: 'users',
        id: testUser.id,
        data: {
          appSettings: {
            language: 'fr' as const,
            darkMode: true,
            biometricAuthEnabled: true,
            notificationsSettings: {
              pushNotificationsEnabled: false,
              emailNotificationsEnabled: false,
              smsNotificationsEnabled: true,
            },
          },
        },
      })

      expect(updatedUser.appSettings?.language).toBe('fr')
      expect(updatedUser.appSettings?.darkMode).toBe(true)
      expect(updatedUser.appSettings?.biometricAuthEnabled).toBe(true)
      expect(updatedUser.appSettings?.notificationsSettings?.smsNotificationsEnabled).toBe(true)
    })

    it('should update user phone number and country', async () => {
      const updatedUser = await payload.update({
        collection: 'users',
        id: testUser.id,
        data: {
          phoneNumber: '+234801234567',
          country: 'ng' as const,
        },
      })

      expect(updatedUser.phoneNumber).toBe('+234801234567')
      expect(updatedUser.country).toBe('ng')
    })

   
  })

  describe('User Deletion', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await payload.create({
        collection: 'users',
        data: {
          email: 'delete@example.com',
          password: 'password123',
          fullName: 'Delete Test User',
          phoneNumber: '+233541234567',
          country: 'gh' as const,
        },
      })
    })

    it('should delete a user', async () => {
      const deletedUser = await payload.delete({
        collection: 'users',
        id: testUser.id,
      })

      expect(deletedUser.id).toBe(testUser.id)

      // Verify user is deleted
      await expect(
        payload.findByID({
          collection: 'users',
          id: testUser.id,
        }),
      ).rejects.toThrow()
    })

    it('should fail to delete non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011' // Valid ObjectId format

      await expect(
        payload.delete({
          collection: 'users',
          id: fakeId,
        }),
      ).rejects.toThrow()
    })
  })

  describe('User Authentication', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await payload.create({
        collection: 'users',
        data: {
          email: 'auth@example.com',
          password: 'securePassword123',
          fullName: 'Auth Test User',
          phoneNumber: '+233541234567',
          country: 'gh' as const,
        },
      })
    })

    it('should create user for authentication testing', async () => {
      // Verify user was created with auth fields
      expect(testUser.email).toBe('auth@example.com')
      expect(testUser.fullName).toBe('Auth Test User')

      // Verify user can be found by email (simulating auth lookup)
      const foundUser = await payload.find({
        collection: 'users',
        where: {
          email: {
            equals: 'auth@example.com',
          },
        },
      })

      expect(foundUser.docs).toHaveLength(1)
      expect(foundUser.docs[0].email).toBe('auth@example.com')
    })

    it('should fail to find user with non-existent email', async () => {
      const result = await payload.find({
        collection: 'users',
        where: {
          email: {
            equals: 'nonexistent@example.com',
          },
        },
      })

      expect(result.docs).toHaveLength(0)
    })
  })

  describe('Default Values', () => {
    it('should apply default values for app settings', async () => {
      const userData = {
        email: 'defaults@example.com',
        password: 'password123',
        fullName: 'Default User',
        phoneNumber: '+233541234567',
        country: 'gh' as const,
      }

      const user = await payload.create({
        collection: 'users',
        data: userData,
      })

      // Check default values
      expect(user.isKYCVerified).toBe(false)
      expect(user.appSettings?.language).toBe('en')
      expect(user.appSettings?.darkMode).toBe(false)
      expect(user.appSettings?.biometricAuthEnabled).toBe(false)
      expect(user.appSettings?.notificationsSettings?.pushNotificationsEnabled).toBe(true)
      expect(user.appSettings?.notificationsSettings?.emailNotificationsEnabled).toBe(true)
      expect(user.appSettings?.notificationsSettings?.smsNotificationsEnabled).toBe(false)
    })
  })

  describe('Complex Queries', () => {
    beforeEach(async () => {
      // Create diverse test data
      const users = [
        {
          email: 'ghana.verified@example.com',
          password: 'password123',
          fullName: 'Ghana Verified User',
          phoneNumber: '+233541111111',
          country: 'gh' as const,
          isKYCVerified: true,
        },
        {
          email: 'ghana.unverified@example.com',
          password: 'password123',
          fullName: 'Ghana Unverified User',
          phoneNumber: '+233542222222',
          country: 'gh' as const,
          isKYCVerified: false,
        },
        {
          email: 'nigeria.verified@example.com',
          password: 'password123',
          fullName: 'Nigeria Verified User',
          phoneNumber: '+234803333333',
          country: 'ng' as const,
          isKYCVerified: true,
        },
        {
          email: 'nigeria.unverified@example.com',
          password: 'password123',
          fullName: 'Nigeria Unverified User',
          phoneNumber: '+234804444444',
          country: 'ng' as const,
          isKYCVerified: false,
        },
      ]

      for (const userData of users) {
        await payload.create({
          collection: 'users',
          data: userData,
        })
      }
    })

    it('should find verified users from Ghana', async () => {
      const result = await payload.find({
        collection: 'users',
        where: {
          and: [
            {
              country: {
                equals: 'gh',
              },
            },
            {
              isKYCVerified: {
                equals: true,
              },
            },
          ],
        },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].country).toBe('gh')
      expect(result.docs[0].isKYCVerified).toBe(true)
    })

    it('should find unverified users from any country', async () => {
      const result = await payload.find({
        collection: 'users',
        where: {
          isKYCVerified: {
            equals: false,
          },
        },
        sort: 'country',
      })

      expect(result.docs).toHaveLength(2)
      result.docs.forEach(user => {
        expect(user.isKYCVerified).toBe(false)
      })
    })

    it('should paginate user results', async () => {
      const page1 = await payload.find({
        collection: 'users',
        limit: 2,
        page: 1,
        sort: 'email',
      })

      const page2 = await payload.find({
        collection: 'users',
        limit: 2,
        page: 2,
        sort: 'email',
      })

      expect(page1.docs).toHaveLength(2)
      expect(page2.docs).toHaveLength(2)
      expect(page1.docs[0].id).not.toBe(page2.docs[0].id)
      expect(page1.page).toBe(1)
      expect(page2.page).toBe(2)
    })
  })
})
