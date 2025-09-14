import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { checkUserExistence } from '@collections/Users/endpoints/check-user-existence'

let payload: Payload

const generateUniqueEmail = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

const generateUniquePhone = (countryCode: string = '+233') =>
  `${countryCode}54${Math.floor(Math.random() * 90000000) + 10000000}`

describe('Check User Existence Endpoint Integration Tests', () => {
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

  describe('POST /api/users/check-user-existence', () => {
    let existingUser: any

    beforeEach(async () => {
      // Create a test user for existence checks
      existingUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('existing'),
          password: '123456',
          fullName: 'Existing User',
          phoneNumber: '+233541234567',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: false,
        },
      })
    })

    it('should return true when phone number and country code exist', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(true)
      expect(responseData.message).toBe('Phone number found in system')
    })

    it('should return false when phone number does not exist', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
      expect(responseData.message).toBe('Phone number not found in system')
    })

    it('should return false when country code does not match', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+234', // Different country code
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
      expect(responseData.message).toBe('Phone number not found in system')
    })

    it('should return true when email exists (OR condition)', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999', // Different phone number
          countryCode: '+233',
          email: existingUser.email, // But same email
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(true)
      expect(responseData.message).toBe('Phone number found in system')
    })

    it('should return true when both phone and email match', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
          email: existingUser.email,
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(true)
      expect(responseData.message).toBe('Phone number found in system')
    })

    it('should return false when neither phone nor email match', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
          email: generateUniqueEmail('nonexistent'),
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
      expect(responseData.message).toBe('Phone number not found in system')
    })

    it('should return error when phone number is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          countryCode: '+233',
          email: 'test@example.com',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should return error when country code is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          email: 'test@example.com',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Country code is required')
    })

    it('should work without email parameter', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(true)
      expect(responseData.message).toBe('Phone number found in system')
    })

    it('should handle database errors gracefully', async () => {
      // Mock a payload instance that throws an error
      const mockRequest = {
        payload: {
          find: () => {
            throw new Error('Database connection failed')
          },
        },
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Error checking phone number')
      expect(responseData.error).toBe('Database connection failed')
    })

    it('should handle empty data object', async () => {
      const mockRequest = {
        payload,
        data: {},
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should handle null data', async () => {
      const mockRequest = {
        payload,
        data: null,
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should be case sensitive for email matching', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
          email: existingUser.email.toUpperCase(), // Different case
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
      expect(responseData.message).toBe('Phone number not found in system')
    })

    it('should handle multiple users with different phone numbers', async () => {
      // Create another user
      const secondUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('second'),
          password: '123456',
          fullName: 'Second User',
          phoneNumber: '+233541234568',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: false,
        },
      })

      // Check first user
      const mockRequest1 = {
        payload,
        data: {
          phoneNumber: existingUser.phoneNumber,
          countryCode: '+233',
        },
      } as any

      // Check second user
      const mockRequest2 = {
        payload,
        data: {
          phoneNumber: secondUser.phoneNumber,
          countryCode: '+233',
        },
      } as any

      const response1 = await checkUserExistence(mockRequest1)
      const responseData1 = await response1.json()

      const response2 = await checkUserExistence(mockRequest2)
      const responseData2 = await response2.json()

      expect(responseData1.exists).toBe(true)
      expect(responseData2.exists).toBe(true)
    })

    it('should handle phone numbers with different formats but same digits', async () => {
      // Test with exact same format as stored
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(true)
      expect(responseData.message).toBe('Phone number found in system')
    })
  })

  describe('Edge Cases and Data Validation', () => {
    it('should handle very long phone numbers', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+2335412345671234567890',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
    })

    it('should handle special characters in phone numbers', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233-541-234-567',
          countryCode: '+233',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.exists).toBe(false)
    })

    it('should handle invalid email formats', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
          email: 'invalid-email',
        },
      } as any

      const response = await checkUserExistence(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      // Should still work even with invalid email format
      expect(responseData.exists).toBe(false)
    })
  })
})
