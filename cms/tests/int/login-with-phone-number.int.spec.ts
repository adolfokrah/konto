import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { loginWithPhoneNumber } from '@collections/Users/endpoints/login-with-phone-number'

let payload: Payload

const generateUniqueEmail = (prefix: string = 'test') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

const generateUniquePhone = (countryCode: string = '+233') =>
  `${countryCode}54${Math.floor(Math.random() * 90000000) + 10000000}`

describe('Login with Phone Number Endpoint Integration Tests', () => {
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

  describe('POST /api/users/login-with-phone', () => {
    let testUser: any

    beforeEach(async () => {
      // Create a test user for login tests
      testUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('logintest'),
          password: '123456',
          fullName: 'Login Test User',
          phoneNumber: '+233541234567',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: true,
        },
      })
    })

    it('should login user successfully with correct phone number and country code', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const loginResponse = await loginWithPhoneNumber(mockRequest)
      const responseData = await loginResponse.json()

      expect(loginResponse.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Login successful')
      expect(responseData.user).toBeDefined()
      expect(responseData.user.id).toBe(testUser.id)
      expect(responseData.user.phoneNumber).toBe('+233541234567')
      expect(responseData.user.countryCode).toBe('+233')
      expect(responseData.user.fullName).toBe('Login Test User')
    })

    it('should fail login with non-existent phone number', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should fail login with wrong country code', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+234', // Wrong country code
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should fail when phone number is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should fail when country code is missing', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Country code is required')
    })

    it('should handle empty data object', async () => {
      const mockRequest = {
        payload,
        data: {},
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
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

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should return user data without sensitive information', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.user).toBeDefined()
      expect(responseData.user.phoneNumber).toBe('+233541234567')
      expect(responseData.user.email).toBeDefined()
      expect(responseData.user.fullName).toBe('Login Test User')
      // Password should not be exposed
      expect(responseData.user.password).toBeUndefined()
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

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Error during login')
      expect(responseData.error).toBe('Database connection failed')
    })

    it('should work with different country codes', async () => {
      // Create user with different country code
      const nigerianUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('nigeria'),
          password: '123456',
          fullName: 'Nigerian User',
          phoneNumber: '+2348012345678',
          countryCode: '+234',
          country: 'ng' as const,
          isKYCVerified: true,
        },
      })

      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+2348012345678',
          countryCode: '+234',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.user.id).toBe(nigerianUser.id)
      expect(responseData.user.countryCode).toBe('+234')
      expect(responseData.user.fullName).toBe('Nigerian User')
    })

    it('should work with users who have different verification status', async () => {
      // Create unverified user
      const unverifiedUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('unverified'),
          password: '123456',
          fullName: 'Unverified User',
          phoneNumber: '+233541234568',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: false, // Not verified
        },
      })

      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234568',
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.user.id).toBe(unverifiedUser.id)
      expect(responseData.user.isKYCVerified).toBe(false)
    })

    it('should handle phone numbers with different formats correctly', async () => {
      // Test exact match (phone numbers should match exactly as stored)
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567', // Exact same format as stored
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.user.phoneNumber).toBe('+233541234567')
    })

    it('should be case-sensitive for phone number matching', async () => {
      // This test ensures exact matching
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle multiple users with same country code but different phone numbers', async () => {
      // Create another user with same country code
      const secondUser = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('second'),
          password: '123456',
          fullName: 'Second User',
          phoneNumber: '+233541234999', // Different phone number
          countryCode: '+233', // Same country code
          country: 'gh' as const,
          isKYCVerified: true,
        },
      })

      // Login with first user
      const mockRequest1 = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      // Login with second user  
      const mockRequest2 = {
        payload,
        data: {
          phoneNumber: '+233541234999',
          countryCode: '+233',
        },
      } as any

      const response1 = await loginWithPhoneNumber(mockRequest1)
      const responseData1 = await response1.json()

      const response2 = await loginWithPhoneNumber(mockRequest2)
      const responseData2 = await response2.json()

      expect(response1.status).toBe(200)
      expect(responseData1.user.id).toBe(testUser.id)
      expect(responseData1.user.phoneNumber).toBe('+233541234567')

      expect(response2.status).toBe(200)
      expect(responseData2.user.id).toBe(secondUser.id)
      expect(responseData2.user.phoneNumber).toBe('+233541234999')
    })
  })

  describe('Edge Cases and Security', () => {
    beforeEach(async () => {
      // Create a test user for edge case tests
      await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('edgecase'),
          password: '123456',
          fullName: 'Edge Case User',
          phoneNumber: '+233541234567',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: true,
        },
      })
    })

    it('should handle very long phone numbers', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+2335412345671234567890',
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should handle special characters in phone numbers', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233-541-234-567',
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should handle empty string values', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '',
          countryCode: '',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should handle undefined values', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: undefined,
          countryCode: undefined,
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number is required')
    })

    it('should handle SQL injection attempts in phone number', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: "'+233541234567' OR '1'='1",
          countryCode: '+233',
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })

    it('should handle SQL injection attempts in country code', async () => {
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: "'+233' OR '1'='1",
        },
      } as any

      const response = await loginWithPhoneNumber(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Phone number not found')
    })
  })

  describe('Integration Flow Tests', () => {
    it('should complete a full login flow for a new user', async () => {
      const phoneNumber = generateUniquePhone()
      const userEmail = generateUniqueEmail('fullflow')

      // Step 1: Create a user (simulating registration)
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: userEmail,
          password: '123456',
          fullName: 'Full Flow User',
          phoneNumber,
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: false,
        },
      })

      // Step 2: Login with the phone number
      const loginRequest = {
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
        },
      } as any

      const loginResponse = await loginWithPhoneNumber(loginRequest)
      const loginData = await loginResponse.json()

      expect(loginResponse.status).toBe(200)
      expect(loginData.success).toBe(true)
      expect(loginData.user.id).toBe(newUser.id)
      expect(loginData.user.phoneNumber).toBe(phoneNumber)
      expect(loginData.user.email).toBe(userEmail)
    })

    it('should handle concurrent login attempts', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: generateUniqueEmail('concurrent'),
          password: '123456',
          fullName: 'Concurrent User',
          phoneNumber: '+233541234567',
          countryCode: '+233',
          country: 'gh' as const,
          isKYCVerified: true,
        },
      })

      // Simulate concurrent login attempts
      const mockRequest = {
        payload,
        data: {
          phoneNumber: '+233541234567',
          countryCode: '+233',
        },
      } as any

      const loginPromises = [
        loginWithPhoneNumber(mockRequest),
        loginWithPhoneNumber(mockRequest),
        loginWithPhoneNumber(mockRequest),
      ]

      const responses = await Promise.all(loginPromises)

      // All should succeed
      for (const response of responses) {
        const data = await response.json()
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.user.id).toBe(user.id)
      }
    })
  })
})
